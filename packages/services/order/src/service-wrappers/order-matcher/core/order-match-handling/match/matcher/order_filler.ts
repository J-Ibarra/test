import Decimal from 'decimal.js'
import { recordCustomEvent } from 'newrelic'
import { Transaction } from 'sequelize'
import { Logger } from '@abx-utils/logging'
import { calculateRealTimeMidPriceForSymbol } from '@abx-service-clients/market-data'
import { CurrencyCode, SymbolBoundaries, SymbolPairStateFilter } from '@abx-types/reference-data'
import {
  DepthState,
  Order,
  OrderDirection,
  OrderMatch,
  OrderMatchStatus,
  OrderStatus,
  OrderType,
  UsdMidPriceEnrichedOrderMatch,
} from '@abx-types/order'
import { saveOrder, createOrderMatchTransaction, validateBoundaries } from '../../../../../../core'
import { OrderMatchResult, OrderWithCancellationDetails } from './matcher'
import { getSymbolBoundaries, getCompleteSymbolDetails } from '@abx-service-clients/reference-data'
import { updateOrderInDepth } from '../../depth'
import { validateOrder } from './validator'

interface OrderFillResult extends OrderMatchResult {
  ordersFilled: boolean
  updatedMatchingOrder?: OrderWithCancellationDetails
}

const logger = Logger.getInstance('lib', 'fillOrders')

export async function fillOrders(
  order: OrderWithCancellationDetails,
  matchingOrder: Order,
  depth: DepthState,
  orderMatches = [] as UsdMidPriceEnrichedOrderMatch[],
  orderUpdates = [] as Order[],
  transaction: Transaction,
): Promise<OrderFillResult> {
  const { matchAmount, orderWithCancellationReason, matchingOderWithCancellationReason } = await calculateAmountMatched(
    order,
    matchingOrder,
    transaction,
  )

  if (matchAmount === 0 || !!orderWithCancellationReason!.shouldCancel || !!matchingOderWithCancellationReason!.shouldCancel) {
    return {
      ordersFilled: false,
      order: orderWithCancellationReason || order,
      updatedMatchingOrder: matchingOderWithCancellationReason || matchingOrder,
      orderMatches,
      orderUpdates,
    }
  }

  try {
    await validateOrder(order, matchingOrder, transaction)
    logger.debug(`Order Balances ${order.id} validated`)
  } catch (e) {
    logger.warn(`Order Balances ${order.id} not validated - cancelling order`)
    logger.warn(e)
    return {
      ordersFilled: false,
      order: { ...order, shouldCancel: true, cancellationReason: `Balance not enough to cover the rest of order ${order.id}` },
      updatedMatchingOrder: matchingOrder,
      orderMatches,
      orderUpdates,
    }
  }

  const symbolBoundaries = await getSymbolBoundaries(order.symbolId, SymbolPairStateFilter.all)

  const orderMatch = buildOrderMatchObject(order, matchingOrder, matchAmount, symbolBoundaries)
  logger.debug(`Created order match ${orderMatch.id} for buy order ${orderMatch.buyOrderId} and sell order ${orderMatch.sellOrderId}`)

  const persistedOrderMatch = await createOrderMatchTransaction(orderMatch, transaction)
  const usdMidPriceEnrichedOrderMatch = await enrichOrderMatchWithUsdMidPrice(persistedOrderMatch.get())
  const { updatedOrder, updatedMatchingOrder } = await updateOrders(order, matchingOrder, matchAmount, depth, symbolBoundaries, transaction)

  return {
    ordersFilled: true,
    order: updatedOrder,
    updatedMatchingOrder,
    orderUpdates: [...orderUpdates, updatedOrder, updatedMatchingOrder],
    orderMatches: [...orderMatches, usdMidPriceEnrichedOrderMatch],
  }
}

async function calculateAmountMatched(
  order: OrderWithCancellationDetails,
  matchingOrder: OrderWithCancellationDetails,
  transaction: Transaction,
): Promise<{
  matchAmount: number
  orderWithCancellationReason?: OrderWithCancellationDetails
  matchingOderWithCancellationReason?: OrderWithCancellationDetails
}> {
  const orderType = order.orderType
  const spreadOrLimitBuyMatch =
    orderType === OrderType.limit && order.direction === OrderDirection.buy && order.limitPrice! >= matchingOrder.limitPrice!
  const spreadOrLimitSellMatch =
    orderType === OrderType.limit && order.direction === OrderDirection.sell && order.limitPrice! <= matchingOrder.limitPrice!

  const matchAmount = Math.min(matchingOrder.remaining, order.remaining)

  if (orderType === OrderType.market || spreadOrLimitBuyMatch || spreadOrLimitSellMatch) {
    const [orderWithCancellationReason, matchingOderWithCancellationReason] = await Promise.all([
      validateOrderBoundary(
        { ...order, amount: order.remaining, limitPrice: matchingOrder.limitPrice, orderType: OrderType.limit },
        matchAmount,
        transaction,
      ),
      validateOrderBoundary({ ...matchingOrder, amount: matchingOrder.remaining }, matchingOrder.remaining, transaction),
    ])

    logger.debug(`Amount matched from ${order.direction} order ${order.id} and ${matchingOrder.direction} order ${matchingOrder.id}: ${matchAmount}`)
    return {
      matchAmount,
      orderWithCancellationReason: { ...orderWithCancellationReason, ...order },
      matchingOderWithCancellationReason: { ...matchingOderWithCancellationReason, ...matchingOrder },
    }
  }

  logger.debug(`Could not match ${order.id} and candidate ${matchingOrder.id}`)
  return { matchAmount: 0 }
}

function buildOrderMatchObject(order: Order, matchedOrder: Order, matchedAmount: number, { quoteBoundary }: SymbolBoundaries): OrderMatch {
  const sellOrder: Order = order.direction === OrderDirection.sell ? order : matchedOrder
  const buyOrder: Order = order.direction === OrderDirection.buy ? order : matchedOrder
  const matchPrice = matchedOrder.limitPrice!

  recordCustomEvent('event_build_order_match_object', {
    symbolId: order.symbolId,
    amount: matchedAmount,
    matchPrice,
  })

  return {
    symbolId: order.symbolId,
    status: OrderMatchStatus.matched,
    amount: matchedAmount,
    matchPrice,
    consideration: new Decimal(matchedAmount).times(matchPrice).toDP(quoteBoundary.maxDecimals, Decimal.ROUND_DOWN).toNumber(),
    sellAccountId: sellOrder.accountId,
    sellOrderId: sellOrder.id!,
    sellOrderType: sellOrder.orderType,
    buyAccountId: buyOrder.accountId,
    buyOrderId: buyOrder.id!,
    buyOrderType: buyOrder.orderType,
  }
}

async function updateOrders(
  order: Order,
  matchingOrder: Order,
  matchAmount: number,
  depth: DepthState,
  symbolBoundaries: SymbolBoundaries,
  transaction: Transaction,
) {
  const [updatedOrder, updatedMatchingOrder] = await Promise.all([
    persistOrderUpdate(order, matchAmount, symbolBoundaries, transaction),
    persistOrderUpdate(matchingOrder, matchAmount, symbolBoundaries, transaction),
  ])

  updateOrderInDepth(updatedMatchingOrder, depth)
  logger.debug(`Updated remaining for order ${updatedMatchingOrder.id} in depth`)

  return {
    updatedOrder,
    updatedMatchingOrder,
  }
}

function persistOrderUpdate(order: Order, amount: number, { baseBoundary }: SymbolBoundaries, transaction?: Transaction): Promise<Order> {
  order.remaining = new Decimal(order.remaining).minus(amount).toDP(baseBoundary.maxDecimals).toNumber()

  order.status = order.remaining === 0 ? OrderStatus.fill : OrderStatus.partialFill
  logger.debug(`Updated remaining order amount for order ${order.id} to ${order.remaining} and status to ${order.status}`)

  return saveOrder({ order, transaction })
}

/**
 * This step is required because we would need the current `{FeeCurrency}_USD` mid price at the time of trade execution
 * when we are calculating the VAT Rate during the settlement process.
 *
 * @param orderMatch the order match
 * @param depth the current depth for all symbols
 * @param transaction the parent transaction
 */
async function enrichOrderMatchWithUsdMidPrice(orderMatch: OrderMatch): Promise<UsdMidPriceEnrichedOrderMatch> {
  const symbol = await getCompleteSymbolDetails(orderMatch.symbolId, SymbolPairStateFilter.all)
  if (symbol.quote.code === CurrencyCode.usd) {
    return {
      ...orderMatch,
      feeCurrencyToUsdMidPrice: orderMatch.matchPrice,
    }
  }

  const feeCurrencyToUsdMidPrice = await calculateRealTimeMidPriceForSymbol(`${symbol.fee.code}_USD`)

  return {
    ...orderMatch,
    feeCurrencyToUsdMidPrice,
  }
}

async function validateOrderBoundary(
  order: OrderWithCancellationDetails,
  matchedAmount: number,
  transaction: Transaction,
): Promise<OrderWithCancellationDetails> {
  try {
    await validateBoundaries({ order, transaction, includeFee: true, matchedAmount })

    return order
  } catch (e) {
    if (e.name === 'ValidationError') {
      logger.debug(`Order id ${order.id} failed boundary validation - cancellation pending`)

      return {
        ...order,
        shouldCancel: true,
        cancellationReason: `Consideration does not meet boundary requirements - cancelling order ${order.id}`,
      }
    } else {
      logger.error(`boundary validation failed for some unknown reason: ${e}`)
      throw e
    }
  }
}
