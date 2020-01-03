export enum BalanceAsyncRequestType {
  finaliseReserve,
  releaseReserve,

  confirmPendingRedemption,
  denyPendingRedemption,

  createPendingDeposit,
  denyPendingDeposit,
  confirmPendingDeposit,

  confirmPendingWithdrawal,
  denyPendingWithdrawal,

  confirmPendingDebitCardTopUp,
  recordDebitCardToExchangeWithdrawal,
}
