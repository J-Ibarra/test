import { Order } from '../core/order'

export interface UpdateOrderRequest {
  orderId: number
  amount?: number
  limitPrice?: number
  requesterAccountId?: string
  expiryDate?: Date
  existingOrder?: Order
}
