import {
  CryptoCurrency,
  CurrencyCode,
  FiatCurrencies,
  FiatCurrency,
  SymbolPair,
  CurrencyBoundary,
  FiatSymbol,
  Environment,
} from '@abx-types/reference-data'
import { findBoundaryForCurrency } from './boundaries'
import Decimal from 'decimal.js'
import { curry } from 'lodash'

interface CurrencyValue {
  currencyCode: CurrencyCode
  value: number
}

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

/**
 * Converts a scientific notation formatted number to a decimal.
 *
 * Source: https://gist.github.com/jiggzson/b5f489af9ad931e3d186
 * @param num the number to remove scientific notation from
 */
export function scientificToDecimal(num: string) {
  const nsign = Math.sign(Number(num))
  // remove the sign
  let formattedNumber = `${Math.abs(Number(num))}`

  // if the number is in scientific notation remove it
  if (/\d+\.?\d*e[\+\-]*\d+/i.test(num)) {
    const zero = '0'
    const parts = String(num).toLowerCase().split('e') // split into coeff and exponent
    const e = parts.pop() // store the exponential part

    let l = Math.abs(Number(e)) // get the number of zeros
    const sign = Number(e) / l
    const coeffArray = parts[0].split('.')
    if (sign === -1) {
      l = l - coeffArray[0].length
      if (l < 0) {
        formattedNumber = coeffArray[0].slice(0, l) + '.' + coeffArray[0].slice(l) + (coeffArray.length === 2 ? coeffArray[1] : '')
      } else {
        formattedNumber = zero + '.' + new Array(l + 1).join(zero) + coeffArray.join('')
      }
    } else {
      const dec = coeffArray[1]
      if (dec) {
        l = l - dec.length
      }
      if (l < 0) {
        formattedNumber = coeffArray[0] + dec.slice(0, l) + '.' + dec.slice(l)
      } else {
        formattedNumber = coeffArray.join('') + new Array(l + 1).join(zero)
      }
    }
  }

  return nsign < 0 ? '-' + formattedNumber : formattedNumber
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

export const erc20Tokens = [CurrencyCode.tether, CurrencyCode.kvt]

export const isERC20Token = (currency: CurrencyCode) => [CurrencyCode.tether, CurrencyCode.kvt].includes(currency)

/**
 * For ERC20 tokens (e.g Tether) when tests are executed we actually test with the YEENUS ERC20 token.
 * So, the transactions that we receive will be YEENUS token transactions which we want to process as tether.
 */
export function getTokenForTransaction(token: string): CurrencyCode {
  return token === 'YEENUS' && process.env.NODE_ENV !== Environment.production ? CurrencyCode.tether : (token as CurrencyCode)
}
