import { Order } from '../core/order'

export interface CancelOrderQueueRequest {
  requestType: 'cancel'
  cancellationReason: string
  order: Order
}
