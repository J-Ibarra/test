import { CurrencyCode } from '@abx-types/reference-data'

export interface WithdrawalCompletionPendingPayload {
  txid: string
  currency: CurrencyCode
}
