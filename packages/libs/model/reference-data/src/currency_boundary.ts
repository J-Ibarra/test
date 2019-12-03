import { CurrencyCode } from '.'

export interface CurrencyBoundary {
  id?: number
  minAmount: number
  maxDecimals: number
  currencyCode: CurrencyCode
  currencyId: number
}
