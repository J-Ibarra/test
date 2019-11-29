import { OrderDirection } from './order_direction.enum'

export interface OrderNotification {
  accountId: string
  contractId: number
  direction: OrderDirection
  orderId: number
  orderMatchId: number
}
