import { getEpicurusInstance } from '@abx/db-connection-utils'
import { OrderEndpoints } from './endpoints'
import { PlaceOrderRequest } from '@abx-types/order'

export function findOrderId(orderId: number) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(OrderEndpoints.findOrderById, { orderId })
}

export function placeOrder(orderToPlace: PlaceOrderRequest) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(OrderEndpoints.placeOrder, { orderToPlace })
}

export * from './endpoints'
