import { CurrencyCode } from '@abx-types/reference-data'
import { BalanceTypeObj } from './balance_type_obj'
import { EDisplayFormats } from './enum/display_formats'

export interface Balance {
  accountId: string
  currency?: CurrencyCode
  currencyId: number
  available: BalanceTypeObj
  reserved: BalanceTypeObj
  pendingDeposit: BalanceTypeObj
  pendingWithdrawal: BalanceTypeObj
  pendingRedemption: BalanceTypeObj
  pendingDebitCardTopUp: BalanceTypeObj
  displayFormat?: EDisplayFormats
}
