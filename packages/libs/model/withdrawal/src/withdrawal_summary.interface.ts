import { CurrencyCode } from '@abx-types/reference-data'

/** The withdrawal summary details. */
export interface WithdrawalSummary {
  /** The withdrawal currency */
  currency: CurrencyCode
  /** The amount to withdraw */
  amount: number
}
