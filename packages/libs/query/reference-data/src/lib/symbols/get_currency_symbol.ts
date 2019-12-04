import { CurrencyCode, FiatSymbol } from '@abx-types/reference-data'

export function getFiatCurrencySymbol(currencyCode: CurrencyCode) {
  if (currencyCode === CurrencyCode.usd) {
    return FiatSymbol.usd
  } else if (currencyCode === CurrencyCode.euro) {
    return FiatSymbol.euro
  }

  return ''
}
