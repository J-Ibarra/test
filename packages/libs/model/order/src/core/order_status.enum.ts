export const enum OrderStatus {
  /** Used for fresh orders where order matching has not been performed yet. */
  submit = 'submit',
  /** Used for orders that could not be fully filled during order matching. */
  partialFill = 'partialFill',
  /** Used for cancelled orders. */
  cancel = 'cancel',
  /**
   * Used for orders where cancellation has been requested but has not been performed yet.
   * Such orders can still be matched by other orders.
   */
  pendingCancel = 'pendingCancel',
  /** Used for filled orders. */
  fill = 'fill',
}
