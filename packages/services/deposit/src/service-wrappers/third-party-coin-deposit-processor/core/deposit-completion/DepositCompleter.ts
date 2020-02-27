import { DepositRequest, DepositRequestStatus } from '@abx-types/deposit'
import { updateDepositRequest, sendDepositConfirmEmail } from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { createCurrencyTransaction } from '@abx-service-clients/order'
import { confirmPendingDeposit } from '@abx-service-clients/balance'
import { TransactionDirection } from '@abx-types/order'
import { SourceEventType } from '@abx-types/balance'
import { findCurrencyForId } from '@abx-service-clients/reference-data'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'

export class DepositCompleter {
  private readonly logger = Logger.getInstance('third-party-coin-deposit-processor', 'DepositCompleter')

  async completeDepositRequest({ amount, depositAddress, id }: DepositRequest) {
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

      await confirmPendingDeposit({
        accountId: depositAddress.accountId,
        amount,
        currencyId: depositAddress.currencyId,
        sourceEventId: currencyTransaction.id!,
        sourceEventType: SourceEventType.currencyDeposit,
      })

      const { code } = await findCurrencyForId(depositAddress.currencyId)
      return sendDepositConfirmEmail(depositAddress.accountId, amount, code)
    })
  }
}
