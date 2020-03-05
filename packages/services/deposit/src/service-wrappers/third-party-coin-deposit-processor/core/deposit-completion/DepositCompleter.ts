import { DepositRequest, DepositRequestStatus, DepositAddress } from '@abx-types/deposit'
import { updateDepositRequest, sendDepositConfirmEmail } from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { createCurrencyTransaction } from '@abx-service-clients/order'
import { triggerMultipleBalanceChanges, BalanceAsyncRequestType } from '@abx-service-clients/balance'
import { TransactionDirection } from '@abx-types/order'
import { SourceEventType } from '@abx-types/balance'
import { findCurrencyForId } from '@abx-service-clients/reference-data'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'
import { findOrCreateKinesisRevenueAccount } from '@abx-service-clients/account'

export class DepositCompleter {
  private readonly logger = Logger.getInstance('third-party-coin-deposit-processor', 'DepositCompleter')

  async completeDepositRequest({ amount, depositAddress, id, holdingsTxFee }: DepositRequest) {
    return wrapInTransaction(sequelize, null, async transaction => {
      this.logger.info(`Completing deposit request ${id}`)

      const [, currencyTransaction] = await Promise.all([
        updateDepositRequest(id!, { status: DepositRequestStatus.completed }, transaction),
        createCurrencyTransaction({
          accountId: depositAddress.accountId,
          amount: amount,
          currencyId: depositAddress.currencyId,
          direction: TransactionDirection.deposit,
          requestId: id!,
        }),
      ])

      await this.triggerBalanceUpdates(id!, depositAddress, amount, holdingsTxFee!, currencyTransaction.id!)

      const { code } = await findCurrencyForId(depositAddress.currencyId)
      return sendDepositConfirmEmail(depositAddress.accountId, amount, code)
    })
  }

  private async triggerBalanceUpdates(
    depositRequestId: number,
    depositAddress: DepositAddress,
    amount: number,
    holdingsTxFee: number,
    currencyTransactionId: number,
  ) {
    const kinesisRevenueAccount = await findOrCreateKinesisRevenueAccount()

    return triggerMultipleBalanceChanges([
      {
        type: BalanceAsyncRequestType.confirmPendingDeposit,
        payload: {
          accountId: depositAddress.accountId,
          amount,
          currencyId: depositAddress.currencyId,
          sourceEventId: currencyTransactionId!,
          sourceEventType: SourceEventType.currencyDeposit,
        },
      },
      {
        type: BalanceAsyncRequestType.confirmPendingWithdrawal,
        payload: {
          accountId: kinesisRevenueAccount.id,
          amount: holdingsTxFee,
          currencyId: depositAddress.currencyId,
          sourceEventId: depositRequestId,
          sourceEventType: SourceEventType.currencyDeposit,
        },
      },
    ])
  }
}
