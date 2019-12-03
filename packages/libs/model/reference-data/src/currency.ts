import { CurrencyCode } from '.'

export interface Currency {
  id: number
  code: CurrencyCode
  symbolSortPriority?: number
  currencyOrderPriority?: number
}
