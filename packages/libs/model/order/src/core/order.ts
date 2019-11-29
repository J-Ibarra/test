import { OrderDirection } from './order_direction.enum'
import { OrderStatus } from './order_status.enum'
import { OrderType } from './order_type.enum'
import { OrderValidity } from './order_validity.enum'
import { OrderMetadata } from './order_metadata'

export interface Order {
  id?: number
  clientOrderId?: string
  accountId: string
  symbolId: string
  direction: OrderDirection
  amount: number
  remaining: number
  status: OrderStatus
  orderType: OrderType
  validity: OrderValidity
  expiryDate?: Date
  limitPrice?: number
  createdAt?: Date | string
  updatedAt?: Date | string
  metadata?: OrderMetadata
  jobId?: string
  globalTransactionId?: string
}
