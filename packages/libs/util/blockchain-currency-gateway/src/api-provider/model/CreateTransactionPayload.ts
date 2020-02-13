import { CryptoAddress } from './CryptoAddress'

/** The payload submitted when creating a new transaction. */
export interface CreateTransactionPayload {
  senderAddress: Pick<CryptoAddress, 'privateKey' | 'address' | 'wif'>
  receiverAddress: string
  amount: number
  /** Defines if a transaction confirmation web-hook to the {@code callbackUrl} should be created. */
  webhookCallbackUrl?: string
  /** The URL (e.g. SQS) to push notification to when webhook registration API Provider call fails. */
  webhookRegistrationFailureUrl?: string
}
