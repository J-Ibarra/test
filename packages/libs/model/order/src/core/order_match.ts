import { OrderType } from './order_type.enum'
import { OrderMatchStatus } from './order_match_status.enum'

export interface OrderMatch {
  id?: number
  symbolId: string
  amount: number
  matchPrice: number
  consideration: number
  sellAccountId: string
  sellOrderId: number
  sellOrderType: OrderType
  buyAccountId: string
  buyOrderId: number
  buyOrderType: OrderType
  status: OrderMatchStatus
  createdAt?: Date
}
