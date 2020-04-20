import { TransactionDirection } from '@abx-types/order'
import { sendAsyncChangeMessage, createUniqueHash } from '@abx-utils/async-message-publisher'

export const CREATE_CURRENCY_TRANSACTION_QUEUE = process.env.CURRENCY_TRANSACTION_QUEUE_URL || 'local-currency-transactions-creation'

export interface CurrencyTransactionCreationRequest {
  accountId: string
  amount: number
  currencyId: number
  direction: TransactionDirection
  requestId: number
}

export function createCurrencyTransaction(transaction: CurrencyTransactionCreationRequest): Promise<void> {
  return sendAsyncChangeMessage<CurrencyTransactionCreationRequest[]>({
    id: `createCurrencyTransactions-${transaction.direction}-${transaction.requestId}`,
    type: 'createCurrencyTransactions',
    target: {
      local: CREATE_CURRENCY_TRANSACTION_QUEUE,
      deployedEnvironment: CREATE_CURRENCY_TRANSACTION_QUEUE,
    },
    payload: [transaction],
  })
}

export function createCurrencyTransactions(transactions: CurrencyTransactionCreationRequest[]): Promise<void> {
  return sendAsyncChangeMessage<CurrencyTransactionCreationRequest[]>({
    id: `createCurrencyTransactions-${createUniqueHash(transactions.map(({ requestId }) => requestId))}`,
    type: 'createCurrencyTransactions',
    target: {
      local: CREATE_CURRENCY_TRANSACTION_QUEUE,
      deployedEnvironment: CREATE_CURRENCY_TRANSACTION_QUEUE,
    },
    payload: transactions,
  })
}

export * from './endpoints'
