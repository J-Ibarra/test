import { DepositRequest } from './DepositRequest'

/**
 * A {@link DepositRequest} wrapper used in the deposit gatekeeper allowing for deposits
 * that are being currently processed to be locked to avoid processing them more than once.
 */
export interface LockableDepositRequest {
  request: DepositRequest
  isLocked: boolean
  /**
   * Allows clients to define a timeframe that a deposit request can be locked for.
   * Useful for failed or new requests where we want to lock the request for a certain period before trying again.
   */
  lockedUntil?: Date
}