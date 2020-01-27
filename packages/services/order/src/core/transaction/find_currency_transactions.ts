import { FindOptions } from 'sequelize'
import { getModel } from '@abx-utils/db-connection-utils'
import { RuntimeError } from '@abx-types/error'
import { CurrencyCode } from '@abx-types/reference-data'
import { CurrencyTransaction } from '@abx-types/order'
import { getCurrencyId } from '@abx-service-clients/reference-data'

export async function findCurrencyTransactions(query: FindOptions) {
  try {
    const { count, rows } = await getModel<CurrencyTransaction>('currencyTransaction').findAndCountAll(query)
    return {
      count,
      rows: rows.map(tr => tr.get()),
    }
  } catch (e) {
    throw new RuntimeError('Unable to fetch currency transactions', {
      context: {
        error: e.stack,
      },
    })
  }
}

export async function findCurrencyTransaction(id: number) {
  try {
    const currencyTransaction = await getModel<CurrencyTransaction>('currencyTransaction').findOne({
      where: {
        id,
      },
    })
    return !!currencyTransaction ? currencyTransaction.get() : null
  } catch (e) {
    throw new RuntimeError('Unable to fetch currency transaction', {
      context: {
        error: e.stack,
      },
    })
  }
}

export async function findCurrencyTransactionForAccountAndCurrency(
  accountId: string,
  selectedCurrency: CurrencyCode,
): Promise<CurrencyTransaction[]> {
  const selectedCurrencyId = await getCurrencyId(selectedCurrency)

  const currencyTransactionQuery = {
    where: {
      currencyId: selectedCurrencyId,
      accountId,
    },
  }
  const { rows: currencyTransactions } = await findCurrencyTransactions(currencyTransactionQuery)
  return currencyTransactions
}
