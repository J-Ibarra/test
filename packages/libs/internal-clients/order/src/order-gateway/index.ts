import { OrderGatewayEndpoints } from './endpoints'
import { PlaceOrderRequest, Order } from '@abx-types/order'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'

export const ORDER_GATEWAY_API_PORT = 3105

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(ORDER_GATEWAY_API_PORT)

export function placeOrder(orderToPlace: PlaceOrderRequest): Promise<Order> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<Order>(OrderGatewayEndpoints.placeOrder, orderToPlace)
}

export function cancelAllOrdersForAccount(accountId: string) {
  return internalApiRequestDispatcher.fireRequestToInternalApi<void>(OrderGatewayEndpoints.cancelAllOrdersForAccount, { accountId })
}

export function cancelOrder(orderId: number, cancellationReason: string) {
  return internalApiRequestDispatcher.fireRequestToInternalApi<void>(OrderGatewayEndpoints.cancelOrder, { orderId, cancellationReason })
}

export function cancelAllExpiredOrders() {
  return internalApiRequestDispatcher.fireRequestToInternalApi<void>(OrderGatewayEndpoints.cancelAllExpiredOrders)
}

export * from './endpoints'
