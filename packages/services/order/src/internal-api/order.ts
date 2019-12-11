import { getEpicurusInstance, messageFactory } from '@abx/db-connection-utils'
import { OrderEndpoints } from '@abx-service-clients/order'
import { findOrderById } from './schemas'
import { findOrder } from '../core'

export function boot() {
  const epicurus = getEpicurusInstance()

  epicurus.server(
    OrderEndpoints.findOrderById,
    messageFactory(findOrderById, ({ orderId }) => findOrder(orderId)),
  )
}
