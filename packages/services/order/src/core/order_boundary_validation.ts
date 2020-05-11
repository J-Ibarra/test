import { isNumber, pipe } from 'lodash/fp'
import { Order, OrderType } from '@abx-types/order'
import { Transaction } from 'sequelize'
import { getSymbolBoundaries } from '@abx-service-clients/reference-data'
import { CurrencyBoundary, Currency } from '@abx-types/reference-data'
import { ValidationError } from '@abx-types/error'
import { determineMaxReserveForTradeValue } from './fees'
import Decimal from '@abx-types/order/node_modules/decimal.js'

interface FormatOrderBoundaryParams {
  order: Order
  baseBoundary: CurrencyBoundary
  quoteBoundary: CurrencyBoundary
  base: Currency
  quote: Currency
  fee: Currency
  matchedAmount?: number
}

interface OrderBoundaryValidationResult {
  valid: boolean
  expects: string
}

type BoundaryField = 'amount' | 'price' | 'consideration'

export type OrderBoundaryResponse = Record<BoundaryField, OrderBoundaryValidationResult>

export async function validateBoundaries({
  order,
  includeFee,
  transaction,
  matchedAmount,
}: {
  order: Order
  transaction?: Transaction
  includeFee?: boolean
  matchedAmount?: number
}): Promise<void> {
  const { baseBoundary, quoteBoundary, base, quote, fee } = await getSymbolBoundaries(order.symbolId)

  const boundaryValidations = await formatBoundaryValidation(
    { order, baseBoundary, quoteBoundary, base, quote, fee, matchedAmount },
    includeFee,
    transaction,
  )

  const errorMessages = formatValidationErrors(boundaryValidations)

  if (errorMessages.length > 0) {
    throw new ValidationError(errorMessages.join(' '))
  }
}

async function formatBoundaryValidation(
  { order, baseBoundary, quoteBoundary, base, fee, matchedAmount }: FormatOrderBoundaryParams,
  includeFeeEstimate?: boolean,
  transaction?: Transaction,
): Promise<OrderBoundaryResponse> {
  const orderAmount =
    base.id === fee.id && includeFeeEstimate
      ? await determineMaxReserveForTradeValue({
          amount: order.amount,
          accountId: order.accountId,
          symbolId: order.symbolId,
          maxDecimalsForCurrency: baseBoundary.maxDecimals,
          feeCurrencyCode: fee.code,
          t: transaction,
        })
      : order.amount

  const orderConsideration = new Decimal(matchedAmount! || order.amount)
    .times(order.limitPrice! || 0)
    .toDP(quoteBoundary.maxDecimals, Decimal.ROUND_DOWN)
    .toNumber()

  if (order.orderType === OrderType.market) {
    return {
      amount: validateValueWithinBoundary(orderAmount, baseBoundary),
    } as OrderBoundaryResponse
  }

  return {
    amount: validateValueWithinBoundary(orderAmount, baseBoundary),
    price: validateValueWithinBoundary(order.limitPrice!, quoteBoundary),
    consideration: validateNumbers(orderConsideration, quoteBoundary.minAmount),
  }
}

export function formatValidationErrors(boundaryValidations: OrderBoundaryResponse) {
  return Object.entries(boundaryValidations).reduce((errorMessage, [field, { valid, expects }]) => {
    return valid ? errorMessage : errorMessage.concat(`The ${field} value is invalid, it must be ${expects}.`)
  }, [] as string[])
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
  (s) => s.split('.'),
  (s) => s[1] || '',
  (s) => s.length,
)

function validateDecimalLength(orderDecimals: number, boundaryDecimals: number): OrderBoundaryValidationResult {
  return {
    valid: orderDecimals <= boundaryDecimals,
    expects: `no more than ${boundaryDecimals} decimal places`,
  }
}
