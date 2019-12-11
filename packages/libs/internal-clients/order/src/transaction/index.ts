import { getEpicurusInstance } from '@abx/db-connection-utils'
import { TradeTransaction } from '@abx-types/order'
import { TradeTransactionEndpoints } from './endpoints'

export function findTradeTransaction(criteria: Partial<TradeTransaction>): Promise<TradeTransaction> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(TradeTransactionEndpoints.findTradeTransaction, { criteria })
}

export function findTradeTransactions(criteria: Partial<TradeTransaction>): Promise<TradeTransaction[]> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(TradeTransactionEndpoints.findTradeTransactions, { criteria })
}

export * from './endpoints'
