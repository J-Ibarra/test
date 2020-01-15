export enum BalanceAsyncRequestType {
  updateAvailable,

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
