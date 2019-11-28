import { OrderDirection } from './order_direction.enum'
import { OrderStatus } from './order_status.enum'

export interface OrderAdminSummary {
  createdAt: Date
  orderId: number
  client: string
  hin: string
  direction: OrderDirection
  symbolId: string
  amount: number
  price: number
  fee?: number
  feeCurrency: string
  filled: number
  status: OrderStatus
}
