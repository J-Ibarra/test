import { OrderDataEndpoints } from './endpoints'
import { TransactionDirection, CurrencyTransaction } from '@abx-types/order'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'
import { ORDER_DATA_API_PORT } from './retrieval_endpoint_handler'

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(ORDER_DATA_API_PORT)

export interface CurrencyTransactionCreationRequest {
  accountId: string
  amount: number
  currencyId: number
  direction: TransactionDirection
  requestId: number
}

export function createCurrencyTransaction(transaction: CurrencyTransactionCreationRequest): Promise<CurrencyTransaction> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<CurrencyTransaction>(OrderDataEndpoints.createCurrencyTransaction, { ...transaction })
}

export * from './endpoints'
