import { Order } from '../core/order'

export interface PlaceOrderQueueRequest {
  requestType: 'place'
  order: Order
}
