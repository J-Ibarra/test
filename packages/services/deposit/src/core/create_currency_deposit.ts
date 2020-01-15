import { SourceEventType } from '@abx-types/balance'
import { wrapInTransaction, sequelize } from '@abx/db-connection-utils'
import { RuntimeError } from '@abx-types/error'
import { createCurrencyTransaction } from '@abx-service-clients/order'
import { CurrencyTransaction } from '@abx-types/order'
import { updateAvailable } from '@abx-service-clients/balance'

export async function createCurrencyDeposit(currencyDeposit: CurrencyTransaction) {
  const { accountId, currencyId, amount } = currencyDeposit

  try {
    const savedCurrencyDeposit: CurrencyTransaction = await wrapInTransaction(sequelize, null, async transaction => {
      const savedTransaction = await createCurrencyTransaction(currencyDeposit as any)

      await updateAvailable({
        accountId,
        amount,
        currencyId,
        sourceEventId: savedTransaction.id!,
        sourceEventType: SourceEventType.currencyDeposit,
        t: transaction,
      })

      return savedTransaction
    })

    return savedCurrencyDeposit
  } catch (e) {
    throw new RuntimeError('Unable to deposit currency', {
      context: {
        error: e.stack,
      },
    })
  }
}
