import { CryptoCurrency, CurrencyCode, FiatCurrencies, FiatCurrency, SymbolPair, FiatSymbol } from '@abx-types/reference-data'

export function isFiatCurrency(ticker: CurrencyCode): ticker is FiatCurrencies {
  return Object.values(FiatCurrency).includes(ticker as any)
}

export function isCryptoCurrency(ticker: CurrencyCode) {
  return Object.values(CryptoCurrency).includes(ticker as any)
}

export function feeTakenFromBase({ base, fee }: SymbolPair) {
  return base.id === fee.id
}

export function getFiatCurrencySymbol(currencyCode: CurrencyCode) {
  if (currencyCode === CurrencyCode.usd) {
    return FiatSymbol.usd
  } else if (currencyCode === CurrencyCode.euro) {
    return FiatSymbol.euro
  }

  return ''
}
