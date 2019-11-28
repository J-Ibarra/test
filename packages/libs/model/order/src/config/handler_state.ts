import { Order } from '../core/order'
import { OrderMatch } from '../core/order_match'
import { OrderQueueRequest } from '../request/order_queue.request'
import { PlaceOrderMeta } from '../core/place_order_meta'

export interface HandlerState {
  queue?: OrderQueueRequest[]
  busyProcessing?: boolean
  broadcast?: {
    orderUpdated: (order: Order, meta?: PlaceOrderMeta) => void
    orderMatched: (orderMatch: OrderMatch) => void
  }
}
