import { CryptoAddress } from './CryptoAddress'

export interface CreateTransactionPayload {
  senderAddress: Pick<CryptoAddress, 'privateKey' | 'address' | 'wif'>
  /** The transaction description/data attach to the transaction. */
  memo?: string
  /** When set to true the actual amount sent will be {@code amount - calculatedFee} */
  subtractFeeFromAmountSent?: boolean
}

export interface SingleTargetCreateTransactionPayload extends CreateTransactionPayload {
  receiverAddress: string
  amount: number
  /**
   * The maximum amount of fee that it is acceptable to pay for the transaction.
   * This is used mostly for withdrawals where we want to make sure kinesis remains profitable.
   */
  feeLimit?: number
  /** The increment that Kinesis wants to add when calculating the fee to be paid, in order to stay ahead of the competition (priority-wise). */
  transactionFeeIncrement?: number
}

export interface MultiTargetCreateTransactionPayload extends CreateTransactionPayload {
  receivers: MultiTargetTransactionReceiver[]
  /**
   * The maximum amount of fee that is acceptable to be paid for the transaction.
   * This is used mostly for withdrawals where we want to make sure kinesis remains profitable.
   */
  feeLimit?: number
  /** The increment that Kinesis wants to add when calculating the fee to be paid, in order to stay ahead of the competition (priority-wise). */
  transactionFeeIncrement?: number
}

export interface MultiTargetTransactionReceiver {
  address: string
  amount: number
}

/** The payload submitted when creating a new transaction. */
export interface CreateEthTransactionPayload {
  fromAddress: Pick<CryptoAddress, 'privateKey' | 'address' | 'wif'>
  toAddress: string
  gasPrice?: number
  gasLimit?: number
  value: number
  password?: string
}

export interface CreateERC_20TransactionPayload {
  fromAddress: Pick<CryptoAddress, 'privateKey' | 'address' | 'wif'>
  toAddress: string
  gasPrice?: number
  gasLimit?: number
  password?: string
  contract: string
  token: number
  /** Defines if a transaction confirmation web-hook to the {@code callbackUrl} should be created. */
  webhookCallbackUrl?: string
  /** The URL (e.g. SQS) to push notification to when webhook registration API Provider call fails. */
  webhookRegistrationFailureUrl?: string
}

export interface MultiTargetTransactionCreationResult {
  txHash: string
  averageFeePerReceiver: number
  totalFee: number
}
