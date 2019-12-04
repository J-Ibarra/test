import { CurrencyCode } from '@abx-types/reference-data'
import { EDisplayFormats } from './enum/display_formats'
import { BalanceAmount } from './balance_amount'

export interface PreferredCurrencyEnrichedBalance {
  currency: CurrencyCode
  total: BalanceAmount
  available: BalanceAmount
  reserved: BalanceAmount
  pendingDeposit: BalanceAmount
  pendingWithdrawal: BalanceAmount
  pendingRedemption: BalanceAmount
  pendingDebitCardTopUp: BalanceAmount
  displayFormat?: EDisplayFormats
}
