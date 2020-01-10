import { CurrencyCode } from '@abx-types/reference-data'

export interface DepositConfirmationEvent {
  accountId: string
  amount: number
  currencyCode: CurrencyCode
  dateOfApproval: Date
  notes: string
  transactionId: string
}
