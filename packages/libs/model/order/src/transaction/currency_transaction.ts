import { TransactionDirection } from './transaction_direction.enum'

export interface CurrencyTransaction {
  id?: number
  accountId: string
  amount: number
  currencyId: number
  direction: TransactionDirection
  requestId?: number
  createdAt?: Date
  updatedAt?: Date
  memo?: string
}
