import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { TradeTransaction, TransactionDirection, CurrencyTransaction } from '@abx-types/order'
import { TradeTransactionEndpoints } from './endpoints'

export interface CurrencyTransactionCreationRequest {
  accountId: string
  amount: number
  currencyId: number
  direction: TransactionDirection
  requestId: number
}

export function findTradeTransaction(criteria: Partial<TradeTransaction>): Promise<TradeTransaction> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(TradeTransactionEndpoints.findTradeTransaction, { criteria })
}

export function findTradeTransactions(criteria: Partial<TradeTransaction>): Promise<TradeTransaction[]> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(TradeTransactionEndpoints.findTradeTransactions, { criteria })
}

export function createCurrencyTransaction(transaction: CurrencyTransactionCreationRequest): Promise<CurrencyTransaction> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(TradeTransactionEndpoints.createCurrencyTransaction, { transaction })
}

export * from './endpoints'
