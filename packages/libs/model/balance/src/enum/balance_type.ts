export interface IBalanceType {
  id: number
  type: string
}

export enum BalanceType {
  available = 1,
  reserved = 2,
  pendingDeposit = 3,
  pendingWithdrawal = 4,
  pendingRedemption = 5,
  pendingDebitCardTopUp = 6,
}
