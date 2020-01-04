import { CurrencyCode } from '@abx-types/reference-data'

export interface DepositRequestParams {
  accountId: string
  currencyTicker: CurrencyCode
}