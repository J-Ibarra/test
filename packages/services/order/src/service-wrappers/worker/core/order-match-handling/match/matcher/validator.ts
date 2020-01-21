import Decimal from 'decimal.js'
import moment from 'moment'
import { recordCustomEvent, recordMetric } from 'newrelic'
import { Transaction } from 'sequelize'
import { findBoundaryForCurrency, getCompleteSymbolDetails, feeTakenFromBase } from '@abx-service-clients/reference-data'
import { Logger } from '@abx/logging'
import { ValidationError } from '@abx-types/error'
import { SymbolPair } from '@abx-types/reference-data'
import { Order, OrderDirection, OrderType } from '@abx-types/order'
import { allocateBuyOrderReserveBalance, getMaxFeeRate } from '../../../../../../core'

const logger = Logger.getInstance('lib', 'validateOrder')

interface FeeCurrencyDetails {
  currencyMinAmount: number
  currencyMaxFeeRate: number
  currencyMaxDecimals: number
}

export async function validateOrder(order: Order, matchingOrder: Order, transaction: Transaction): Promise<void> {
  if (order.direction === OrderDirection.buy && order.orderType === OrderType.market) {
    logger.info(`Current matching order for ${order.symbolId}:`)
    logger.info(JSON.stringify(matchingOrder))

    return validateAndReserveBuyMarketOrder(order, matchingOrder, transaction)
  }
}

export function validateOrderExpiry(order: Order) {
  if (order.expiryDate && moment(order.expiryDate).isBefore(new Date())) {
    logger.error(`Tried performing order match for expired order ${order.id}`)

    recordMetric('metric_order_expired', 1)

    throw new ValidationError('The order has already expired')
  }
}

async function validateAndReserveBuyMarketOrder(order: Order, matchingOrder: Order, transaction: Transaction): Promise<void> {
  const pair = await getCompleteSymbolDetails(order.symbolId)
  logger.debug(`Validating if account ${order.accountId} has enough funds to cover buy market order `)

  const feeAndAmountBoundaryDetails = await getFeeAndAmountBoundaryDetails(order, pair, transaction)
  logger.debug(`Found the fee and boundary details ${JSON.stringify(feeAndAmountBoundaryDetails)}`)

  const reserveRequired = await getMarketOrderValue(order, matchingOrder, pair, order.remaining, feeAndAmountBoundaryDetails)

  logger.debug(`Balance validation of order ${order.id} and account ${order.accountId} completed. The total reserve is: ${reserveRequired}`)

  await allocateBuyOrderReserveBalance({ order, pair, precalculatedReservePrice: reserveRequired })
}

export async function getMarketOrderValue(
  order: Order,
  matchingOrder: Order,
  symbol: SymbolPair,
  amount: number,
  feeCurrencyDetails: FeeCurrencyDetails,
): Promise<number> {
  const matchPrice = calculateMatchDetails(symbol, order, amount, matchingOrder, feeCurrencyDetails)

  recordCustomEvent('event_get_market_order_value', {
    baseCurrency: symbol.base.code,
    quoteCurrency: symbol.quote.code,
    matchPrice,
  })

  return matchPrice
}

function calculateMatchDetails(
  symbol: SymbolPair,
  { accountId: marketOrderAccount, id: marketOrderId }: Order,
  marketOrderAmount: number,
  matchingOrder: Order,
  { currencyMaxFeeRate, currencyMaxDecimals, currencyMinAmount }: FeeCurrencyDetails,
) {
  const orderExpiredOrPlacedBySameAccount =
    (matchingOrder.expiryDate && moment(matchingOrder.expiryDate).isBefore(new Date())) || matchingOrder.accountId === marketOrderAccount

  const amountMatched = orderExpiredOrPlacedBySameAccount ? 0 : Math.min(matchingOrder.remaining, marketOrderAmount)
  logger.debug(`amountMatched ${amountMatched} for order ${marketOrderId}`)

  const remaining = new Decimal(marketOrderAmount).minus(amountMatched).toNumber()
  logger.debug(`remaining ${remaining} for order ${marketOrderId}`)

  const matchPriceNoFee = new Decimal(amountMatched).times(matchingOrder.limitPrice!)
  logger.debug(`matchPriceNoFee ${matchPriceNoFee} for order ${marketOrderId}`)

  const orderFee = matchPriceNoFee.times(currencyMaxFeeRate)
  logger.debug(`orderFee ${orderFee} for order ${marketOrderId}`)
  const feeToUse = orderFee.equals(0) ? new Decimal(0) : Decimal.max(currencyMinAmount || 0, orderFee)
  logger.debug(`feeToUse ${feeToUse} for order ${marketOrderId}`)

  const matchPrice = feeTakenFromBase(symbol)
    ? matchPriceNoFee.toDP(currencyMaxDecimals, Decimal.ROUND_DOWN).toNumber()
    : matchPriceNoFee
        .plus(feeToUse)
        .toDP(currencyMaxDecimals, Decimal.ROUND_DOWN)
        .toNumber()
  logger.debug(`matchPrice ${matchPrice} for market order ${marketOrderId} and match order ${matchingOrder.id}`)

  return matchPrice
}

async function getFeeAndAmountBoundaryDetails({ accountId, symbolId }: Order, pair, transaction: Transaction): Promise<FeeCurrencyDetails> {
  const { maxDecimals: currencyMaxDecimals, minAmount: currencyMinAmount } = await findBoundaryForCurrency(pair.quote.code)

  const currencyMaxFeeRate = feeTakenFromBase(pair) ? 0 : await getMaxFeeRate(accountId, symbolId, transaction)

  return { currencyMinAmount, currencyMaxFeeRate, currencyMaxDecimals }
}
