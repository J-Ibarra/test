import { CryptoAddress } from './CryptoAddress'

/** The payload submitted when creating a new transaction. */
export interface CreateTransactionPayload {
  senderAddress: Pick<CryptoAddress, 'privateKey' | 'address' | 'wif'>
  receiverAddress: string
  amount: number
  /** The transaction description/data attach to the transaction. */
  memo?: string
  /** Defines if a transaction confirmation web-hook to the {@code callbackUrl} should be created. */
  webhookCallbackUrl?: string
  /** The URL (e.g. SQS) to push notification to when webhook registration API Provider call fails. */
  webhookRegistrationFailureUrl?: string
  /**
   * The maximum amount of fee that it is acceptable to pay for the transaction.
   * This is used mostly for withdrawals where we want to make sure kinesis remains profitable.
   */
  feeLimit?: number
}
