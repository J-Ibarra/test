import { DepositRequest, DepositRequestStatus, DepositAddress } from '@abx-types/deposit'
import { updateAllDepositRequests, sendDepositConfirmEmail } from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { createCurrencyTransaction } from '@abx-service-clients/order'
import { triggerMultipleBalanceChanges, BalanceAsyncRequestType } from '@abx-service-clients/balance'
import { TransactionDirection } from '@abx-types/order'
import { SourceEventType } from '@abx-types/balance'
import { findCurrencyForId } from '@abx-service-clients/reference-data'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'
import { findOrCreateKinesisRevenueAccount } from '@abx-service-clients/account'
import Decimal from 'decimal.js'
import { getDepositTransactionFeeCurrencyId } from '../utils'
import { CurrencyCode } from '@abx-types/reference-data'

export class DepositCompleter {
  private readonly logger = Logger.getInstance('third-party-coin-deposit-processor', 'DepositCompleter')

  /**
   * Carries out the final step of the deposit process where:
   * - all deposit requests are updated with 'completed' status
   * - a single deposit currency transaction is created with the total amount
   * - balances (of the deposit user and kinesis revenue) are updated
   * - a deposit success email is dispatched.
   *
   * The function will be invoked with multiple requests when there have been some
   * pre-existing deposit requests where the amount was lower than the minimum deposit amount.
   *
   * @param depositRequests the deposit requests to complete
   */
  async completeDepositRequests(depositRequests: DepositRequest[]) {
    return wrapInTransaction(sequelize, null, async transaction => {
      this.logger.info(`Completing deposit requests ${JSON.stringify(depositRequests)}`)

      const depositAddress = depositRequests[0].depositAddress
      const depositRequestWhereHoldingsFeeWasRecorded = depositRequests.find(({ holdingsTxFee }) => !!holdingsTxFee)!

      const totalAmount = depositRequests.reduce((acc, { amount }) => new Decimal(acc).plus(amount), new Decimal(0)).toNumber()
      const { code } = await findCurrencyForId(depositAddress.currencyId)

      const [, currencyTransaction] = await Promise.all([
        updateAllDepositRequests(
          depositRequests.map(({ id }) => id!),
          { status: DepositRequestStatus.completed },
          transaction,
        ),
        createCurrencyTransaction({
          accountId: depositAddress.accountId,
          amount: totalAmount,
          currencyId: depositAddress.currencyId,
          direction: TransactionDirection.deposit,
          requestId: depositRequestWhereHoldingsFeeWasRecorded.id!,
        }),
      ])

      await this.triggerBalanceUpdates(
        depositRequestWhereHoldingsFeeWasRecorded.id!,
        depositAddress,
        totalAmount,
        depositRequestWhereHoldingsFeeWasRecorded.holdingsTxFee!,
        currencyTransaction.id!,
        code,
      )

      return sendDepositConfirmEmail(depositAddress.accountId, totalAmount, code)
    })
  }

  private async triggerBalanceUpdates(
    depositRequestId: number,
    { currencyId, accountId }: DepositAddress,
    amount: number,
    holdingsTxFee: number,
    currencyTransactionId: number,
    depositCurrencyCode: CurrencyCode,
  ) {
    const kinesisRevenueAccount = await findOrCreateKinesisRevenueAccount()
    const transactionFeeCurrencyId = await getDepositTransactionFeeCurrencyId(currencyId, depositCurrencyCode)

    return triggerMultipleBalanceChanges([
      {
        type: BalanceAsyncRequestType.confirmPendingDeposit,
        payload: {
          accountId,
          amount,
          currencyId,
          sourceEventId: currencyTransactionId!,
          sourceEventType: SourceEventType.currencyDeposit,
        },
      },
      {
        type: BalanceAsyncRequestType.confirmPendingWithdrawal,
        payload: {
          accountId: kinesisRevenueAccount.id,
          amount: holdingsTxFee,
          currencyId: transactionFeeCurrencyId,
          sourceEventId: depositRequestId,
          sourceEventType: SourceEventType.currencyDeposit,
        },
      },
    ])
  }
}
