import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { OrderGatewayEndpoints } from './endpoints'
import { PlaceOrderRequest } from '@abx-types/order'

export function placeOrder(orderToPlace: PlaceOrderRequest) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(OrderGatewayEndpoints.placeOrder, { orderToPlace })
}

export function cancelAllOrdersForAccount(accountId: string) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(OrderGatewayEndpoints.cancelAllOrdersForAccount, { accountId })
}

export function cancelOrder(orderId: string, cancellationReason: string) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(OrderGatewayEndpoints.cancelOrder, { orderId, cancellationReason })
}

export function cancelAllExpiredOrders() {
  const epicurus = getEpicurusInstance()
  return epicurus.request(OrderGatewayEndpoints.cancelAllExpiredOrders, {})
}

export * from './endpoints'
