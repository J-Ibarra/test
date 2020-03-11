/**
 * The states that a withdrawal request can be in.
 */
export enum WithdrawalState {
  cancelled = 'cancelled',
  completed = 'completed',
  holdingsTransactionCompleted = 'holdingsTransactionCompleted',
  pending = 'pending',
}
