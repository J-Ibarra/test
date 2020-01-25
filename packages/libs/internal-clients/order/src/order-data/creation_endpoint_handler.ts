import { getEpicurusInstance } from '@abx/db-connection-utils'
import { OrderDataEndpoints } from './endpoints'
import { TransactionDirection, CurrencyTransaction } from '@abx-types/order'

export interface CurrencyTransactionCreationRequest {
  accountId: string
  amount: number
  currencyId: number
  direction: TransactionDirection
  requestId: number
}

export function createCurrencyTransaction(transaction: CurrencyTransactionCreationRequest): Promise<CurrencyTransaction> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(OrderDataEndpoints.createCurrencyTransaction, { transaction })
}

export * from './endpoints'
