import { CurrencyCode } from '@abx-types/reference-data'
import { EDisplayFormats } from '@abx-types/balance'

export interface BalanceSummary {
  currency: CurrencyCode
  available: number
  reserved: number
  pendingDeposit: number
  pendingWithdrawal: number
  displayFormat?: EDisplayFormats
}
