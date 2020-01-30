import { getEpicurusInstance, messageFactory } from '@abx-utils/db-connection-utils'
import { findOrderByIdSchema, getOpenOrdersSchema } from './schemas'
import { findOrder, getOpenOrders } from '../../../core'
import { OrderDataEndpoints } from '@abx-service-clients/order'

export function boot() {
  const epicurus = getEpicurusInstance()

  epicurus.server(
    OrderDataEndpoints.findOrderById,
    messageFactory(findOrderByIdSchema, ({ orderId }) => findOrder(orderId)),
  )

  epicurus.server(
    OrderDataEndpoints.getOpenOrders,
    messageFactory(getOpenOrdersSchema, ({ symbolId, orderDirection, limit }) => getOpenOrders(symbolId, orderDirection, limit)),
  )
}
