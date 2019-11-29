import { Currency } from './currency';

export interface SymbolPair {
  id: string
  base: Currency
  quote: Currency
  fee: Currency
}