import { PlaceOrderRequest } from '../request/place_order.request'
import { Order } from '../core/order'
import { CancelOrderRequest } from '../request/cancel_order.request'
import { AccountOrderCancellationRequest } from '../request/account_order_cancellation.request'

export interface OrderModuleExports {
  placeOrder: (request: PlaceOrderRequest) => Promise<Order>
  cancelOrder: (request: CancelOrderRequest) => Promise<Order>
  cancelAllOrdersForAccount: (request: AccountOrderCancellationRequest) => Promise<void>
}
