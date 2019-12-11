import { FindOptions, Transaction } from 'sequelize'
import { sequelize, getModel, wrapInTransaction } from '@abx/db-connection-utils'
import { RuntimeError } from '@abx-types/error'
import { OrderMatch } from '@abx-types/order'

export async function findOrderMatchTransaction(query: FindOptions): Promise<OrderMatch[]> {
  try {
    const rows = await getModel<OrderMatch>('orderMatchTransaction').findAll(query)
    return rows.map(tr => tr.get())
  } catch (e) {
    throw new RuntimeError('Unable to fetch order match transactions', {
      context: {
        error: e.stack,
      },
    })
  }
}

export async function findOrderMatchTransactions(query: FindOptions, transaction?: Transaction): Promise<OrderMatch[]> {
  return wrapInTransaction(sequelize, transaction, async t => {
    try {
      const rows = await getModel<OrderMatch>('orderMatchTransaction').findAll({ ...query, transaction: t })
      return rows.map(tr => tr.get())
    } catch (e) {
      throw new RuntimeError('Unable to fetch order match transactions', {
        context: {
          error: e.stack,
        },
      })
    }
  })
}

/**
 * Retrieves the last order match for a given symbol.
 *
 * @param symbolId the symbol ID
 */
export async function findLastOrderMatchForSymbol(symbolId: string, transaction?: Transaction): Promise<OrderMatch> {
  return wrapInTransaction(sequelize, transaction, async t => {
    const orderMatches = await findOrderMatchTransaction({
      where: { symbolId },
      order: [['createdAt', 'DESC']],
      limit: 1,
      transaction: t,
    })

    return orderMatches[0]
  })
}
