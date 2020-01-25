import { getEpicurusInstance, messageFactory } from '@abx/db-connection-utils'
import { findOrderById, getOpenOrders as getOpenOrdersSchema } from './schemas'
import { findOrder, getOpenOrders } from '../../../core'
import { OrderDataEndpoints } from '@abx-service-clients/order'

export function boot() {
  const epicurus = getEpicurusInstance()

  epicurus.server(
    OrderDataEndpoints.findOrderById,
    messageFactory(findOrderById, ({ orderId }) => findOrder(orderId)),
  )

  epicurus.server(
    OrderDataEndpoints.getOpenOrders,
    messageFactory(getOpenOrdersSchema, ({ symbolId, orderDirection, limit }) => getOpenOrders(symbolId, orderDirection, limit)),
  )
}
