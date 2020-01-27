import sinon from 'sinon'
import { isEqual } from 'lodash'
import { Order, OrderDirection, OrderStatus, OrderType, OrderValidity, PlaceOrderRequest } from '@abx-types/order'
import { waitForSettlement as waitToBeSettled } from './settlement_waiter'
import { getEpicurusInstance, sequelize } from '@abx-utils/db-connection-utils'
import { OrderGatewayEndpoints, OrderPubSubChannels } from '@abx-service-clients/order'
import { TradeExecutionResult } from '../../../core'
import * as balanceOperations from '@abx-service-clients/balance'
import { CurrencyCode } from '@abx-types/reference-data'

export async function placeBuyMarketOrder({ amount, buyerAccountId, pair, waitForSettlement = false, waitForCancellation = false }): Promise<Order> {
  const buyMarketOrder: PlaceOrderRequest = {
    accountId: buyerAccountId,
    amount,
    direction: OrderDirection.buy,
    orderType: OrderType.market,
    validity: OrderValidity.GTC,
    symbolId: pair.id,
  }

  return placeOrder(buyMarketOrder, waitForSettlement, waitForCancellation)
}

export async function placeBuyLimitOrder({
  amount,
  limitPrice,
  buyerAccountId,
  pair,
  waitForSettlement = false,
  waitForCancellation = false,
}): Promise<Order> {
  const buyLimitOrder: PlaceOrderRequest = {
    accountId: buyerAccountId,
    amount,
    direction: OrderDirection.buy,
    orderType: OrderType.limit,
    validity: OrderValidity.GTC,
    symbolId: pair.id,
    limitPrice,
  }

  return placeOrder(buyLimitOrder, waitForSettlement, waitForCancellation)
}

export async function placeSellMarketOrder({
  amount,
  sellerAccountId,
  pair,
  waitForSettlement = false,
  waitForCancellation = false,
}): Promise<Order> {
  const sellMarketOrder: PlaceOrderRequest = {
    accountId: sellerAccountId,
    orderType: OrderType.market,
    amount,
    direction: OrderDirection.sell,
    validity: OrderValidity.GTC,
    symbolId: pair.id,
  }

  return placeOrder(sellMarketOrder, waitForSettlement, waitForCancellation)
}

export async function placeSellLimitOrder({
  amount,
  limitPrice,
  sellerAccountId,
  pair,
  waitForSettlement = false,
  waitForCancellation = false,
}): Promise<Order> {
  const sellLimitOrder: PlaceOrderRequest = {
    accountId: sellerAccountId,
    orderType: OrderType.limit,
    amount,
    direction: OrderDirection.sell,
    validity: OrderValidity.GTC,
    symbolId: pair.id,
    limitPrice,
  }

  return placeOrder(sellLimitOrder, waitForSettlement, waitForCancellation)
}

async function placeOrder(order: PlaceOrderRequest, waitForSettlement: boolean, waitForCancellation: boolean): Promise<Order> {
  const epicurus = getEpicurusInstance()

  const placedOrder = await epicurus.request(OrderGatewayEndpoints.placeOrder, order)

  if (waitForSettlement) {
    await waitToBeSettled(placedOrder.id, placedOrder.direction)
  } else if (waitForCancellation) {
    await waitToBeCancelled(placedOrder.id)
  }

  return placedOrder
}

export async function cancelOrder(order: Order, waitForCancellation: boolean): Promise<Order> {
  const epicurus = getEpicurusInstance()

  const cancelledOrder = await epicurus.request(OrderGatewayEndpoints.cancelOrder, { orderId: order.id })

  if (waitForCancellation) {
    return waitToBeCancelled(order.id!)
  }

  return cancelledOrder
}

export async function stubBalanceReserveAdjustmentCalls(
  params: { accountId: string; orderId: number; currencyCode: CurrencyCode; expectedInitialReserve: number }[],
) {
  // The fee is set to 0.1 by default

  const stub = sinon.stub(balanceOperations, 'getOrderBalanceReserveAdjustment')

  params.forEach(({ currencyCode, orderId, accountId, expectedInitialReserve }) =>
    stub.withArgs(currencyCode, accountId, orderId).resolves({
      delta: expectedInitialReserve,
    }),
  )
}

export function subscribeToTradeExecutionResults(): Record<string, TradeExecutionResult> {
  const epicurus = getEpicurusInstance()
  const executionResults: Record<string, TradeExecutionResult> = {}
  epicurus.subscribe(OrderPubSubChannels.orderExecutionResultDispatched, ({ orderId, accountId, amountReceived, amountFilled }) => {
    executionResults[orderId] = {
      orderId,
      accountId,
      amountReceived,
      amountFilled,
    }
  })

  return executionResults
}

export async function waitForExecutionResultToMatchExpected(
  executionResults: Record<string, TradeExecutionResult>,
  expectedTradeExecutionResult: TradeExecutionResult,
) {
  if (
    !executionResults[expectedTradeExecutionResult.orderId] ||
    (!!executionResults[expectedTradeExecutionResult.orderId] &&
      !isEqual(executionResults[expectedTradeExecutionResult.orderId], expectedTradeExecutionResult))
  ) {
    await new Promise(res => setTimeout(res, 50))

    return waitForExecutionResultToMatchExpected(executionResults, expectedTradeExecutionResult)
  }

  return
}

export async function waitToBeCancelled(orderId: number) {
  const order = await sequelize.models.order.findOne({ where: { id: orderId } })

  if (order && order.status === OrderStatus.cancel) {
    return order
  }

  await new Promise(res => setTimeout(res, 20))
  return waitToBeCancelled(orderId)
}
