import Decimal from 'decimal.js'
import { curry } from 'lodash'
import { CurrencyBoundary } from '@abx-types/reference-data'

function truncateForBoundary(currencyBoundary: CurrencyBoundary, amount: number) {
  return new Decimal(amount).toDP(currencyBoundary.maxDecimals, Decimal.ROUND_DOWN).toNumber()
}

export const truncateCurrencyDecimals = curry(truncateForBoundary)
