import { getEpicurusInstance } from '@abx/db-connection-utils'
import { TradeTransaction, TransactionDirection } from '@abx-types/order'
import { TradeTransactionEndpoints } from './endpoints'

export interface CurrencyTransactionCreationRequest {
  accountId: string
  amount: number
  currencyId: number
  direction: TransactionDirection.withdrawal
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

export function createCurrencyTransaction(transaction: CurrencyTransactionCreationRequest): Promise<void> {
  console.log(transaction)
  return Promise.resolve()
}

export * from './endpoints'
