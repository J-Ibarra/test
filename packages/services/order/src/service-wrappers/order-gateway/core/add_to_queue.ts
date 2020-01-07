import { OrderQueueRequest, Order } from '@abx-types/order'
import { v4 } from 'node-uuid'
import { recordCustomEvent } from 'newrelic'
import { getCacheClient } from '@abx/db-connection-utils'

const redisClient = getCacheClient()

export function addToQueue(orderRequest: OrderQueueRequest | OrderQueueRequest[]): any {
  if (Array.isArray(orderRequest)) {
    return orderRequest.map(request => addOrderToGatekeeperQueue(getSymbolId(request), request))
  } else {
    return addOrderToGatekeeperQueue(getSymbolId(orderRequest), orderRequest)
  }
}

export function getSymbolId(orderRequest: OrderQueueRequest): string {
  return orderRequest.order.symbolId
}

export function addOrderToGatekeeperQueue(symbolId: string, orderRequest: OrderQueueRequest): Promise<Order> {
  const jobId = v4()
  orderRequest.jobId = jobId

  recordCustomEvent('event_add_order_request_to_queue', {
    requestType: orderRequest.requestType,
    orderId: orderRequest.order.id,
    symbolId,
  })

  return new Promise(async resolve => {
    await redisClient.addValueToHeadOfList<OrderQueueRequest>(`exchange:orders:queue:${symbolId}`, orderRequest)
    await redisClient.incrementHashField(`orderQueueLength`, `contract:${symbolId}`, 1)
    resolve(orderRequest.order)
  })
}
