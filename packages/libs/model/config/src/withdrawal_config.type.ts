import { CurrencyWithdrawalConfig } from '.'
import { CurrencyCode } from '@abx-types/reference-data'

export type WithdrawalConfig = { [k in Exclude<CurrencyCode, 'GBP' | 'BTC'>]: CurrencyWithdrawalConfig }
