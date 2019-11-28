export interface UpdateOrderMessage {
  orderId: number
  amount?: number
  requesterAccountId?: string
  expiryDate?: Date
  limitPrice?: number
}
