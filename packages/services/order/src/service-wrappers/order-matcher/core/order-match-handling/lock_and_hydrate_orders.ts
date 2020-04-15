import * as _ from 'lodash'
import { Logger } from '@abx-utils/logging'
import { getCacheClient } from '@abx-utils/db-connection-utils'
import { getAllSymbolPairSummaries } from '@abx-service-clients/reference-data'
import { Order, OrderStatus, OrderType } from '@abx-types/order'
import { CancelOrderQueueRequest, OrderQueueRequest, PlaceOrderQueueRequest } from '@abx-types/order'
import { addToQueue } from '../../../order-gateway/core/add_to_queue'
import { findOrders } from '../../../../core'
import { getDepthFromCache } from './depth/redis'
import { SymbolPairStateFilter } from '@abx-types/reference-data'

const redisCacheGateway = getCacheClient()

const logger = Logger.getInstance('lib', 'lock_and_hydrate_orders')

export const publishDbOrdersToQueue = async () => {
  // process first
  const pendingCancelOrdersNotInOrderQueue = await getOrdersNotInOrderQueue([OrderStatus.pendingCancel])

  if (pendingCancelOrdersNotInOrderQueue.length) {
    logger.debug(`${pendingCancelOrdersNotInOrderQueue.length} pending cancel orders found`)
    await addToQueue(pendingCancelOrdersNotInOrderQueue)

    logger.debug(`Pending cancel orders added to queue`)
  }

  // process second
  const openOrders = await getOrdersNotInOrderQueueOrDepth([OrderStatus.submit, OrderStatus.partialFill])

  if (openOrders.length) {
    logger.debug(`${openOrders.length} open orders found`)

    await addToQueue(openOrders)
    logger.debug(`Open orders added to queue`)
  }
}

async function getOrdersNotInOrderQueueOrDepth(statuses: OrderStatus[]): Promise<Array<PlaceOrderQueueRequest | CancelOrderQueueRequest>> {
  const [orders, orderIdsOfQueuedOrders, orderIdsOfDepthOrders] = await Promise.all([
    findOrders({
      where: {
        orderType: [OrderType.market, OrderType.limit],
        status: statuses,
      },
      order: ['createdAt'],
    }),
    getCurrentOrderIdsForQueuedOrders(),
    getCurrentOrderIdsForOrdersInDepth(),
  ])

  return orders.reduce(
    (orderRequests, order) =>
      !orderIdsOfQueuedOrders.includes(order.id!) && !orderIdsOfDepthOrders.includes(order.id!)
        ? orderRequests.concat(createOrderQueueRequestForOrder(order!) as any)
        : orderRequests,
    [] as (PlaceOrderQueueRequest | CancelOrderQueueRequest)[],
  )
}

async function getOrdersNotInOrderQueue(statuses: OrderStatus[]): Promise<Array<PlaceOrderQueueRequest | CancelOrderQueueRequest>> {
  const [orders, orderIdsOfQueuedOrders] = await Promise.all([
    findOrders({
      where: {
        orderType: [OrderType.market, OrderType.limit],
        status: statuses,
      },
      order: ['createdAt'],
    }),
    getCurrentOrderIdsForQueuedOrders(),
  ])

  return orders.reduce(
    (orderRequests, order) =>
      !orderIdsOfQueuedOrders.includes(order.id!) ? orderRequests.concat(createOrderQueueRequestForOrder(order) as any) : orderRequests,
    [] as Array<PlaceOrderQueueRequest | CancelOrderQueueRequest>,
  )
}

async function getCurrentOrderIdsForQueuedOrders(): Promise<number[]> {
  const symbols = await getAllSymbolPairSummaries(SymbolPairStateFilter.all)
  const orderQueueRequestsForAllSymbols = await Promise.all(
    symbols.map(({ id }) => redisCacheGateway.getList<OrderQueueRequest>(`exchange:orders:queue:${id}`)),
  )

  return _.flatMap(orderQueueRequestsForAllSymbols, (placeOrderRequests) => placeOrderRequests.map(({ order }) => order.id!))
}

async function getCurrentOrderIdsForOrdersInDepth(): Promise<number[]> {
  const symbols = await getAllSymbolPairSummaries(SymbolPairStateFilter.all)
  const depthForSymbols = await Promise.all(symbols.map(({ id }) => getDepthFromCache(id)))

  return _.flatMap(depthForSymbols, ({ buy, sell }) => buy.concat(sell).map(({ id }) => id!))
}

function createOrderQueueRequestForOrder(order: Order): OrderQueueRequest | CancelOrderQueueRequest {
  return order.status === OrderStatus.pendingCancel
    ? ({
        requestType: 'cancel',
        cancellationReason: 'pending cancelled order picked up after hydration',
        order,
      } as CancelOrderQueueRequest)
    : ({
        requestType: 'place',
        order,
      } as OrderQueueRequest)
}
