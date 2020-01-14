import { FindOptions, Transaction, WhereOptions } from 'sequelize'
import { sequelize, getModel } from '@abx/db-connection-utils'
import { TradeTransaction } from '@abx-types/order'

interface TradeTransactionOrderAggregation {
  orderId: number
  averagePrice: number
  feeSum: number
}

export async function buildTradeTransactionOrderAggregation(): Promise<TradeTransactionOrderAggregation[]> {
  const resultInstances = (await getModel<TradeTransactionOrderAggregation>('tradeTransaction').findAll({
    raw: true,
    attributes: [
      'orderId',
      [sequelize.fn('avg', sequelize.col('matchPrice')), 'averagePrice'],
      [sequelize.fn('sum', sequelize.col('fee')), 'feeSum'],
    ],
    group: ['orderId'],
  })) as any[]

  return resultInstances.reduce((acc, result) => {
    return acc.concat({
      ...result,
      averagePrice: +result.averagePrice,
      feeSum: +result.feeSum,
    })
  }, [])
}

export async function findTradeTransactions(sequelizeQuery: FindOptions): Promise<{ count: number; rows: TradeTransaction[] }> {
  const { count, rows } = await getModel<TradeTransaction>('tradeTransaction').findAndCountAll(sequelizeQuery)

  return {
    count,
    rows: rows.map(trans => trans.get()),
  }
}

export async function findTradeTransactionsForSymbol(symbolId: string, from: Date): Promise<TradeTransaction[]> {
  const tradeTransactions = await getModel<TradeTransaction>('tradeTransaction').findAll({
    where: {
      symbolId,
      createdAt: { $gte: from },
    },
  })
  return tradeTransactions.map(tradeTransaction => tradeTransaction.get())
}

export async function findTradeTransactionsCount(query: WhereOptions): Promise<number> {
  return getModel<TradeTransaction>('tradeTransaction').count({
    where: query,
  })
}

export async function findTradeTransaction(sequelizeQuery: FindOptions): Promise<TradeTransaction | null> {
  const tradeTransaction = await getModel<TradeTransaction>('tradeTransaction').findOne(sequelizeQuery)
  return !!tradeTransaction ? tradeTransaction.get() : null
}

export async function findTradeTransactionForAccountAndSymbols(accountId: string, symbolId: string | string[]): Promise<TradeTransaction[]> {
  const tradeTransactions = await getModel<TradeTransaction>('tradeTransaction').findAll({
    where: {
      symbolId,
      accountId,
    },
  })
  return tradeTransactions.map(tradeTransaction => tradeTransaction.get())
}

export async function countTradeTransaction(sequelizeQuery: WhereOptions, transaction?: Transaction): Promise<number> {
  return getModel<TradeTransaction>('tradeTransaction').count({ where: sequelizeQuery, transaction })
}
