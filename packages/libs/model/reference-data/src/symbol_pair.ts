import { Currency } from './currency'

export interface SymbolPair {
  id: string
  base: Currency
  quote: Currency
  fee: Currency
  orderRange: number | null
  sortOrder?: number | null
}
