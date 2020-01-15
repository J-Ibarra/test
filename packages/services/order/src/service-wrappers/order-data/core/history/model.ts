import { CurrencyCode } from '@abx-types/reference-data'
import { TransactionType } from '@abx-types/order'

export const enum TransactionHistoryDirection {
  incoming = 'incoming',
  outgoing = 'outgoing',
}

export interface TransactionHistory {
  transactionType: TransactionType
  primaryCurrencyCode: CurrencyCode
  primaryAmount: number
  preferredCurrencyCode: CurrencyCode
  preferredCurrencyAmount: number
  title: string
  memo: string
  isFee?: boolean
  direction: TransactionHistoryDirection
  createdAt: Date
  targetAddress?: string
  transactionId?: number | string
  fee?: number
  feeCurrency?: CurrencyCode
}
