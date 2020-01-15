import { CryptoCurrency, CurrencyCode, FiatCurrencies, FiatCurrency, SymbolPair, CurrencyBoundary, FiatSymbol } from '@abx-types/reference-data'
import { findBoundaryForCurrency } from './boundaries'
import Decimal from 'decimal.js'
import { curry } from 'lodash'

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

interface CurrencyValue {
  currencyCode: CurrencyCode
  value: number
}

export async function formatCurrencyValue({
  value: { currencyCode, value },
  boundary,
  appendCurrencyCode,
}: {
  value: CurrencyValue
  boundary: CurrencyBoundary
  appendCurrencyCode?: boolean
}): Promise<string> {
  const digits: number = boundary ? boundary.maxDecimals : 5
  const isCrypto: boolean = isCryptoCurrency(currencyCode)

  const valueWithFractionalDigitsStrippedOut = stripOutFractionalDigits(value.toString(), digits)
  const formatter = isCrypto
    ? new Intl.NumberFormat('en-US', {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      })
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode })

  const output: string = `${formatter.format(+valueWithFractionalDigitsStrippedOut)}${appendCurrencyCode ? ` ${currencyCode}` : ''}`
  return output
}

export async function truncateCurrencyValue({ currencyCode, value }: CurrencyValue): Promise<string> {
  const currencyBoundaryResponse = await findBoundaryForCurrency(currencyCode)
  const currencyBoundary = currencyBoundaryResponse[currencyCode]
  const digits: number = currencyBoundary ? currencyBoundary.maxDecimals : 5
  const valueWithFractionalDigitsStrippedOut = stripOutFractionalDigits(value.toString(), digits)
  return valueWithFractionalDigitsStrippedOut
}

/**
 * Strips out fractional digits which exceed the allowed number of fraction digits for the currency value.
 * This is done to prevent the value from being rounded up/down.
 * Example:
 * USD is allowed 2 fractional digits
 * For input value of `2.157` if the `7` is not stripped out Intl.NumberFormat would format the value to `2.16`
 */
const stripOutFractionalDigits = (value: string, allowedFractionDigits: number): string => {
  const [digitsInput, decimalsInput] = value.split('.')

  if (!decimalsInput && !value.includes('.')) {
    return digitsInput
  }

  const amountToDpWithoutRounding = digitsInput.concat('.', decimalsInput.slice(0, allowedFractionDigits))

  return amountToDpWithoutRounding
}

function truncateForBoundary(currencyBoundary: CurrencyBoundary, amount: number) {
  return new Decimal(amount).toDP(currencyBoundary.maxDecimals, Decimal.ROUND_DOWN).toNumber()
}

export const truncateCurrencyDecimals = curry(truncateForBoundary) as (boundary: CurrencyBoundary, number?: number) => number
