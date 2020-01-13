import Decimal from 'decimal.js'
import _ from 'lodash'
import { isNullOrUndefined } from 'util'
import { CurrencyCode, FiatCurrency, SymbolPair } from '@abx-types/reference-data'
import { calculateRealTimeMidPriceForSymbol } from '@abx-service-clients/market-data'

type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>> }[Keys]

/**
 * Get the Symbol pair {selectedCurrency / preferredCurrency}
 * @param selectedSymbols
 * @param preferredCurrency
 */
export function getPreferredSymbol(selectedSymbols: SymbolPair[], preferredCurrency: CurrencyCode): SymbolPair {
  // TODO: This is a hotfix; when the preferred currency value changes from the hard-coded USD, the logic might need to be changed
  const hasPreferredCurrencyAsQuoteInSymbols = selectedSymbols.find(symbol => symbol.quote.code === preferredCurrency)
  if (!hasPreferredCurrencyAsQuoteInSymbols) {
    const notPreferredFiatCurrencies = Object.values(FiatCurrency).filter(fiatCurrency => fiatCurrency !== (preferredCurrency as any))
    return selectedSymbols.find(symbol => {
      return notPreferredFiatCurrencies.find(c => (symbol.quote.code as any) === c)
    })!
  }

  return hasPreferredCurrencyAsQuoteInSymbols
}

/**
 * Get the mid price of the give preferred symbol in particular date.
 * @param preferredSymbolPair
 * @param preferredCurrencyCode
 * @param date
 */
export async function getMidPriceForSymbolWithDate(preferredCurrencyCode: CurrencyCode, preferredSymbolPair: SymbolPair): Promise<number> {
  if (!preferredSymbolPair) {
    return 1
  }
  const midPrice = (await calculateRealTimeMidPriceForSymbol(preferredSymbolPair.id)) || 1

  return preferredSymbolPair.quote.code === preferredCurrencyCode ? 1 / midPrice : midPrice
}

/**
 * Returns an amount based on a ratio of two values and a known value.
 * Function takes in a numerator and a denominator value and then requires either one of the knownNumerator or knownDenominator values
 * Depending on what `known` value is passed in it will return the opposite. ie IF knownNumerator is pass in it will return a denominator value
 *
 * @param numeratorCurrencyAmount
 * @param denominatorCurrencyAmount
 * @param { knownDenominatorValue | knownNumeratorValue } | This is an interface that must take in one or the other. Can only have 1 at a time.
 */
export const findCurrencyAmountBasedOnRatio = (numeratorCurrencyAmount: number | Decimal, denominatorCurrencyAmount: number | Decimal) => (
  params: RequireOnlyOne<{
    knownDenominatorValue: number | Decimal
    knownNumeratorValue: number | Decimal
  }> = { knownDenominatorValue: 0, knownNumeratorValue: undefined },
): number => {
  const currencyRatio = new Decimal(numeratorCurrencyAmount).div(denominatorCurrencyAmount)
  if (!isNullOrUndefined(params.knownDenominatorValue)) {
    return new Decimal(params.knownDenominatorValue).mul(currencyRatio).toNumber()
  }
  if (!isNullOrUndefined(params.knownNumeratorValue)) {
    return new Decimal(params.knownNumeratorValue).div(currencyRatio).toNumber()
  }

  return 0
}
