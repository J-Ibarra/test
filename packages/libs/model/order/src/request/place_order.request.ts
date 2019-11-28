import { OrderDirection } from '../core/order_direction.enum'
import { OrderType } from '../core/order_type.enum'
import { OrderValidity } from '../core/order_validity.enum'

export interface PlaceOrderRequest {
  accountId: string
  clientOrderId?: string
  symbolId: string
  direction: OrderDirection
  amount: number
  orderType: OrderType
  limitPrice?: number
  validity: OrderValidity
  expiryDate?: Date
}
