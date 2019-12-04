//import { CurrencyCode } from '@abx-types/reference-data';
import { CurrencyCode } from '@abx-types/reference-data';

export interface CurrencyWithdrawalConfig {
    feeCurrency: CurrencyCode
    feeAmount: number
    minimumAmount: number
  }