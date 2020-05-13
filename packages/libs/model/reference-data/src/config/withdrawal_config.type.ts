import { CurrencyWithdrawalConfig } from '.'
import { CurrencyCode } from '../currency_code.enum'

export type WithdrawalConfig = { [k in Exclude<CurrencyCode, 'GBP'>]: CurrencyWithdrawalConfig }
