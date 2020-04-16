/**
 * The states that a withdrawal request can be in.
 */
export enum WithdrawalState {
  cancelled = 'cancelled',
  completed = 'completed',
  holdingsTransactionCompleted = 'holdingsTransactionCompleted',
  pending = 'pending',
  /**
   * This state has been added with the introduction of BTC where we
   * might need to wait on UTXOs of a previous withdrawal to be confirmed before
   * we can carry out the current withdrawal.
   */
  waiting = 'waiting',
}
