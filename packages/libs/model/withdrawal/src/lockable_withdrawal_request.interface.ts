import { CurrencyEnrichedWithdrawalRequest } from './withdrawal_request.interface'

/**
 * A {@link WithdrawalRequest} wrapper used in the withdrawal gatekeeper allowing for deposits
 * that are being currently processed to be locked to avoid processing them more than once.
 */
export interface LockableWithdrawalRequest {
  withdrawalRequest: CurrencyEnrichedWithdrawalRequest
  /** The separate fee request associated with the withdrawal, only present for KVT where we have an ETH fee request. */
  feeRequest?: CurrencyEnrichedWithdrawalRequest
  isLocked: boolean
  /**
   * Allows clients to define a timeframe that a deposit request can be locked for.
   * Useful for failed or new requests where we want to lock the request for a certain period before trying again.
   */
  lockedUntil?: Date
}
