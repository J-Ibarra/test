import { TransactionDirection } from '@abx-types/order'
import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'

export const CREATE_CURRENCY_TRANSACTION_QUEUE = process.env.CURRENCY_TRANSACTION_QUEUE_URL || 'local-currency-transactions-creation'

export interface CurrencyTransactionCreationRequest {
  accountId: string
  amount: number
  currencyId: number
  direction: TransactionDirection
  requestId: number
}

export function createCurrencyTransaction(transaction: CurrencyTransactionCreationRequest): Promise<void> {
  return sendAsyncChangeMessage<CurrencyTransactionCreationRequest>({
    id: `createCurrencyTransaction-${transaction.direction}-${transaction.requestId}`,
    type: 'createCurrencyTransaction',
    target: {
      local: CREATE_CURRENCY_TRANSACTION_QUEUE,
      deployedEnvironment: CREATE_CURRENCY_TRANSACTION_QUEUE,
    },
    payload: transaction,
  })
}

export * from './endpoints'
