import { CurrencyCode } from '../currency_code.enum'

export interface CurrencyWithdrawalConfig {
  feeCurrency: CurrencyCode
  feeAmount: number
  minimumAmount: number
}
