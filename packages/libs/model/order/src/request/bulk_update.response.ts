import { Order } from '../core/order'

export interface BulkUpdateResponse {
  order: Order
  updateStatus: number
}
