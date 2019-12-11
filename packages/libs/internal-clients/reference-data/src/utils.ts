import { CryptoCurrency, CurrencyCode, FiatCurrencies, FiatCurrency, SymbolPair } from '@abx-types/reference-data'

export function isFiatCurrency(ticker: CurrencyCode): ticker is FiatCurrencies {
  return Object.values(FiatCurrency).includes(ticker as any)
}

export function isCryptoCurrency(ticker: CurrencyCode) {
  return Object.values(CryptoCurrency).includes(ticker as any)
}

export function feeTakenFromBase({ base, fee }: SymbolPair) {
  return base.id === fee.id
}
