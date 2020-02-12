import { RuntimeError } from '@abx-types/error'
import { Order, OrderStatus, PlaceOrderMeta } from '@abx-types/order'
import { OrderPubSubChannels } from '@abx-service-clients/order'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'

export function handleOrderUpdated(order: Order, meta?: PlaceOrderMeta) {
  const epicurus = getEpicurusInstance()
  const cmdMap = {
    [OrderStatus.cancel]: OrderPubSubChannels.orderCancelled,
    [OrderStatus.fill]: OrderPubSubChannels.orderFilled,
    [OrderStatus.partialFill]: OrderPubSubChannels.orderPartiallyFilled,
  }

  if (!cmdMap[order.status]) {
    throw new RuntimeError(`Order status: ${order.status} not found in cmdMap for order with id: ${order.id}`)
  }

  epicurus.publish(cmdMap[order.status], Object.assign({}, order, meta))
}
