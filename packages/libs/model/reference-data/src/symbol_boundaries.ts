import { CurrencyBoundary } from './currency_boundary'
import { Currency } from './currency'

export interface SymbolBoundaries {
  baseBoundary: CurrencyBoundary
  quoteBoundary: CurrencyBoundary
  base: Currency
  quote: Currency
  fee: Currency
}
