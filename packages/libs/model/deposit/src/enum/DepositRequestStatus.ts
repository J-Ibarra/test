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

  blockedForHoldingsTransactionConfirmation = 'blockedForHoldingsTransactionConfirmation',

  // Set after the holdings transaction has been dispatched
  pendingHoldingsTransactionConfirmation = 'pendingHoldingsTransactionConfirmation',


  // The following states are specific to the KAU/KAG deposit flow
  // The deposit request is received
  received = 'received',
  // The deposit request is stored successfully and the transaction is being created
  completedPendingHoldingsTransaction = 'completedPendingHoldingsTransaction',
}
