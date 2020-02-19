export enum DepositRequestStatus {
  pendingHoldingsTransaction = 'pendingHoldingsTransaction',
  pendingCompletion = 'pendingCompletion',
  failedHoldingsTransaction = 'failedHoldingsTransaction',
  completed = 'completed',
  suspended = 'suspended',

  // The following are statuses added for the new deposit flow (API provider based)
  pendingDepositTransactionConfirmation = 'pendingDepositTransactionConfirmation',
  pendingHoldingsTransactionConfirmation = 'pendingHoldingsTransactionConfirmation',
}
