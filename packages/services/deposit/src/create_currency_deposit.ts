import { BalanceMovementFacade } from '@abx-service-clients/balance'
import { SourceEventType } from '@abx-types/balance'
import sequelize from '../../db/abx_modules'
import { wrapInTransaction } from '../../db/transaction_wrapper'
import { RuntimeError } from '@abx-types/error'
import { createCurrencyTransaction, CurrencyTransaction } from '@abx-service-clients/order'

export async function createCurrencyDeposit(currencyDeposit: CurrencyTransaction) {
  const { accountId, currencyId, amount } = currencyDeposit

  try {
    const savedCurrencyDeposit: CurrencyTransaction = await wrapInTransaction(
      sequelize,
      null,
      async transaction => {
        const savedTransaction = await createCurrencyTransaction(currencyDeposit, transaction)

        await BalanceMovementFacade.getInstance().updateAvailable({
          accountId,
          amount,
          currencyId,
          sourceEventId: savedTransaction.id,
          sourceEventType: SourceEventType.currencyDeposit,
          t: transaction,
        })

        return savedTransaction
      },
    )

    return savedCurrencyDeposit
  } catch (e) {
    throw new RuntimeError('Unable to deposit currency', {
      context: {
        error: e.stack,
      },
    })
  }
}
