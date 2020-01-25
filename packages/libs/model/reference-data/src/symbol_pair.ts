import { Currency } from './currency'

export interface SymbolPair {
  id: string
  base: Currency
  quote: Currency
  fee: Currency
  orderRange: number | null
  sortOrder?: number | null
}

/** Wallet aka vault symbols */
export enum WalletSymbols {
  kau = 'KAU_USD',
  kag = 'KAG_USD',
}
