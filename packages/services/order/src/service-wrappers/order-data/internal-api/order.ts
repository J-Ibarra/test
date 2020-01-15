import { getEpicurusInstance, messageFactory } from '@abx/db-connection-utils'
import { findOrderById } from './schemas'
import { findOrder } from '../../../core'
import { OrderDataEndpoints } from '@abx-service-clients/order'

export function boot() {
  const epicurus = getEpicurusInstance()

  epicurus.server(
    OrderDataEndpoints.findOrderById,
    messageFactory(findOrderById, ({ orderId }) => findOrder(orderId)),
  )
}
