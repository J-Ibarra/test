import { CurrencyCode } from './currency_code.enum'

export interface SymbolPairApiResponse {
  id: string
  /** The base currency details. */
  base: CurrencyCode
  /** The quote currency details. */
  quote: CurrencyCode
  /** The fee that the currency comes out of */
  fee: CurrencyCode
  /** The percentage used to limit order price ranges. */
  orderRange?: number | null
  sortOrder?: number | null
}
