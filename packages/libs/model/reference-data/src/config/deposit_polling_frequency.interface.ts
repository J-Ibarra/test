import { CurrencyCode } from '../currency_code.enum'

export interface DepositPollingFrequency {
  currency: CurrencyCode
  // The deposit hot wallet polling frequency in ms
  frequency: number
}
