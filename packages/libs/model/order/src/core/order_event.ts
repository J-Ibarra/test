import { Order } from './order'
import { OrderStatus } from './order_status.enum'

export interface OrderEvent {
  id?: number
  orderId: number
  order?: Order
  remaining: number
  cancellationReason: string
  status: OrderStatus
  data: string
}
