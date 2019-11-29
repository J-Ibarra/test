import { UpdateOrderRequest } from './update_order.request'

export interface BulkUpdateRequest {
  requests: UpdateOrderRequest[]
}
