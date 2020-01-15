import { CurrencyBoundary } from '@abx-types/reference-data'
import { isNumber, pipe } from 'lodash/fp'

interface OrderBoundaryValidationResult {
  valid: boolean
  expects: string
}

export function validateValueWithinBoundary(orderValue: number, boundary: CurrencyBoundary) {
  const numbersCheck = validateNumbers(orderValue, boundary.minAmount)

  if (!numbersCheck.valid) {
    return numbersCheck
  }

  const decimalCheck = validateDecimals(orderValue, boundary.maxDecimals)

  return decimalCheck
}

function validateNumbers(orderValue: number, boundaryValue: number): OrderBoundaryValidationResult {
  const valid = isNumber(orderValue) && orderValue >= boundaryValue

  return {
    valid,
    expects: `a number no less than ${boundaryValue}`,
  }
}

const validateDecimals = (orderValue: number, boundaryDecimals: number): OrderBoundaryValidationResult => {
  const orderDecimals = getDecimalLength(orderValue)
  return validateDecimalLength(orderDecimals, boundaryDecimals)
}

const getDecimalLength: (value: number) => number = pipe(
  String,
  s => s.split('.'),
  s => s[1] || '',
  s => s.length,
)

function validateDecimalLength(orderDecimals: number, boundaryDecimals: number): OrderBoundaryValidationResult {
  return {
    valid: orderDecimals <= boundaryDecimals,
    expects: `no more than ${boundaryDecimals} decimal places`,
  }
}
