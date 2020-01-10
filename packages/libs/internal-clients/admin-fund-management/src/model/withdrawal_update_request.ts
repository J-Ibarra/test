export interface WithdrawalUpdateRequest {
  globalTransactionId: string
  description?: string
  paymentStatus: string
  updatedAt: Date
  tradingPlatformName: string
}
