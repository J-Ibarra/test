import { PlaceOrderRequest } from './place_order.request'

export interface BulkPlaceRequest {
  requests: PlaceOrderRequest[]
}
