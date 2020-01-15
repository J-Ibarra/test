import { Account } from '@abx-types/account'
import { Currency, CurrencyCode, FiatCurrency } from '@abx-types/reference-data'

export interface DepositAddress {
  id?: number
  account?: Account
  accountId: string
  currency?: Currency
  currencyId: number
  encryptedPrivateKey: string
  publicKey: string
}

export enum DepositRequestStatus {
  pendingHoldingsTransaction = 'pendingHoldingsTransaction',
  pendingCompletion = 'pendingCompletion',
  failedHoldingsTransaction = 'failedHoldingsTransaction',
  completed = 'completed',
  suspended = 'suspended',
}

export interface DepositRequest {
  id?: number
  depositAddressId?: number
  depositAddress: DepositAddress
  amount: number
  /** The transaction hash of the transaction into the deposit address. */
  depositTxHash: string
  /** The transaction hash of the transaction from the deposit address into the holdings address. */
  holdingsTxHash?: string
  /** The transaction for the on chain transaction recorded so that it can be rebated (subtracted) from the kinesis revenue account on deposit completion. */
  holdingsTxFee?: number
  from: string
  status: DepositRequestStatus
  fiatConversion: number
  fiatCurrencyCode: FiatCurrency
  updatedAt?: Date
}

export interface DepositRequestPayload {
  currencyTicker: CurrencyCode
}

export interface DepositRequestParams {
  accountId: string
  currencyTicker: CurrencyCode
}

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
