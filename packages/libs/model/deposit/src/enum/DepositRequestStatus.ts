export enum DepositRequestStatus {
  pendingHoldingsTransaction = 'pendingHoldingsTransaction',
  pendingCompletion = 'pendingCompletion',
  failedHoldingsTransaction = 'failedHoldingsTransaction',
  completed = 'completed',
  suspended = 'suspended',

  // The following are statuses added for the new deposit flow (API provider based)
  // Set when we are waiting for a deposit transaction to be confirmed
  pendingDepositTransactionConfirmation = 'pendingDepositTransactionConfirmation',
  // The deposit request amount is below the minimum allowed amount for the currency
  insufficientAmount = 'insufficientAmount',
}
