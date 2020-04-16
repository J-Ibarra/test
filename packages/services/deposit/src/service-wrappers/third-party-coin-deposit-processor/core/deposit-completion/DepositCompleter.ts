import { DepositRequest, DepositRequestStatus, DepositAddress } from '@abx-types/deposit'
import { updateAllDepositRequests, sendDepositConfirmEmail, findDepositRequestsByHoldingsTransactionHash, findDepositRequestsForStatus } from '../../../../core'
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
import { CurrencyCode, SymbolPairStateFilter } from '@abx-types/reference-data'
import { HoldingsTransactionDispatcher } from '../holdings-transaction-creation/HoldingsTransactionDispatcher'

export class DepositCompleter {
  private readonly logger = Logger.getInstance('third-party-coin-deposit-processor', 'DepositCompleter')

  private DEFAULT_REQUIRED_DEPOSIT_TRANSACTION_CONFIRMATIONS = 1
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
  async processPendingHoldingsForDepositRequest(depositRequests: DepositRequest[]) {
    return wrapInTransaction(sequelize, null, async (transaction) => {
      this.logger.info(`Completing deposit requests ${JSON.stringify(depositRequests)}`)

      const depositAddress = depositRequests[0].depositAddress
      const depositRequestWhereHoldingsFeeWasRecorded = depositRequests.find(({ holdingsTxFee }) => !!holdingsTxFee)!

      const totalAmount = depositRequests.reduce((acc, { amount }) => new Decimal(acc).plus(amount), new Decimal(0)).toNumber()
      const depositCurrency = await findCurrencyForId(depositAddress.currencyId, SymbolPairStateFilter.all)

      await Promise.all([
        updateAllDepositRequests(
          depositRequests.map(({ id }) => id!),
          { status: DepositRequestStatus.pendingHoldingsTransaction },
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
        { ...depositAddress, currency: depositCurrency },
        totalAmount,
        depositRequestWhereHoldingsFeeWasRecorded.holdingsTxFee!,
      )

      return sendDepositConfirmEmail(depositAddress.accountId, totalAmount, depositCurrency.code)
    })
  }

  public async completeDepositRequest(txid: string) {
    const depositRequests = await findDepositRequestsByHoldingsTransactionHash(txid)

    if (depositRequests.length === 0) {
      this.logger.warn(`Deposit request not found for holdings transaction ${txid}, not processing any further`)
      return
    }

    await this.completeDepositRequests(depositRequests)
    this.logger.info(`Completed deposit requests ${JSON.stringify(depositRequests)}`)
  }

  private async completeDepositRequests(depositRequests: DepositRequest[]) {
    return wrapInTransaction(sequelize, null, async (transaction) => {
      
      // create new holdings consolidated transaction for blocked deposit requests
      const depositAddressId = depositRequests[0].depositAddressId
      const currencyCode = depositRequests[0].depositAddress.currency

      const blockedDepositRequests = await findDepositRequestsForStatus(depositAddressId!, DepositRequestStatus.blockedForHoldingsTransactionConfirmation)

      const holdingsTransactionDispatcher = new HoldingsTransactionDispatcher()
      await holdingsTransactionDispatcher.dispatchHoldingsTransactionForDepositRequests(
        blockedDepositRequests,
        currencyCode,
      )
      
      updateAllDepositRequests(
        depositRequests.map(({ id }) => id!),
        { status: DepositRequestStatus.completed },
        transaction)
    })
  }

  public getRequiredConfirmationsForDepositTransaction(currency: CurrencyCode) {
    if (currency === CurrencyCode.bitcoin) {
      return Number(process.env.BITCOIN_TRANSACTION_CONFIRMATION_BLOCKS)
    }

    return this.DEFAULT_REQUIRED_DEPOSIT_TRANSACTION_CONFIRMATIONS
  }

  private async triggerBalanceUpdates(depositRequestId: number, { accountId, currency }: DepositAddress, amount: number, holdingsTxFee: number) {
    const kinesisRevenueAccount = await findOrCreateKinesisRevenueAccount()
    const transactionFeeCurrencyId = await getDepositTransactionFeeCurrencyId(currency!.id, currency!.code)

    return triggerMultipleBalanceChanges([
      {
        type: BalanceAsyncRequestType.confirmPendingDeposit,
        payload: {
          accountId,
          amount,
          currencyId: currency!.id,
          sourceEventId: depositRequestId!,
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
