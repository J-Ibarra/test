import { CurrencyCode } from '@abx-types/reference-data';

export interface DepositPollingFrequency {
    currency: CurrencyCode
    // The deposit hot wallet polling frequency in ms
    frequency: number
  }