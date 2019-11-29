import { UpdateOrderMessage } from '../core/update_order_message'
import { Order } from '../core/order'

export interface OrderQueueRequest {
  requestType: string
  updateOrder?: UpdateOrderMessage
  order: Order
  cancellationReason?: string
  prevalidated?: boolean
  jobId?: string
}
