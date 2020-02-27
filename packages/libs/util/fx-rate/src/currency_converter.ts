import Decimal from 'decimal.js'

import { CurrencyCode, FiatCurrency } from '@abx-types/reference-data'
import { getQuoteFor } from './fx_rate_provider'
import { SupportedFxPair } from '@abx-types/order'
import { truncateCurrencyValue, getAllSymbolsIncludingCurrency } from '@abx-service-clients/reference-data'
import { calculateRealTimeMidPriceForSymbol } from '@abx-service-clients/market-data'

export async function convertAmountToFiatCurrency(currencyCode: CurrencyCode, fiatCurrencyCode: FiatCurrency, amount: number) {
  if (currencyCode === fiatCurrencyCode.toString()) {
    return truncateCurrencyValue({ currencyCode: fiatCurrencyCode as any, value: amount })
  }

  if (currencyCode === CurrencyCode.euro) {
    const usdForOneEur = await getQuoteFor(SupportedFxPair.EUR_USD)
    const convertedValue = new Decimal(amount).times(usdForOneEur).toNumber()
    return truncateCurrencyValue({ currencyCode: fiatCurrencyCode as any, value: convertedValue })
  } else {
    return convertAndTruncateCurrencyValue(new Decimal(amount), currencyCode, fiatCurrencyCode as any)
  }
}

export async function convertAndTruncateCurrencyValue(
  tradeAmount: Decimal,
  tradeCurrencyCode: CurrencyCode,
  toCurrencyCode: CurrencyCode,
): Promise<string> {
  const allSymbols = await getAllSymbolsIncludingCurrency(tradeCurrencyCode)
  const targetSymbol = allSymbols.find(symbol => symbol.base.code === toCurrencyCode || symbol.quote.code === toCurrencyCode)
  if (!targetSymbol) {
    return '0'
  }

  const midPrice = (await calculateRealTimeMidPriceForSymbol(targetSymbol.id)) || 1
  const convertedValue =
    targetSymbol.quote.code === toCurrencyCode
      ? tradeAmount.times(midPrice).toNumber()
      : tradeAmount.dividedBy(midPrice).toNumber()

  return truncateCurrencyValue({ currencyCode: toCurrencyCode, value: convertedValue })
}
