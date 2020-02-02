import { findOrder, getOpenOrders } from '../../../core'
import { OrderDataEndpoints } from '@abx-service-clients/order'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createOrderQueryEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: OrderDataEndpoints.findOrderById,
      handler: ({ orderId }) => findOrder(orderId),
    },
    {
      path: OrderDataEndpoints.getOpenOrders,
      handler: ({ symbolId, orderDirection, limit }) => getOpenOrders(symbolId, orderDirection, limit),
    },
  ]
}
