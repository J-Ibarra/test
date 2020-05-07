import { CurrencyCode, FiatCurrency } from '@abx-types/reference-data'
import { CryptoAddress, Transaction } from './model'
import { DepositAddress } from '@abx-types/deposit'

export interface DepositTransaction {
  txHash: string
  amount: number
  from: string
  to?: string
  pagingToken?: string
}

export interface DepositTransactionWithFiatConversion {
  amount: number
  from: string
  depositTxHash: string
  fiatConversion: number
  fiatCurrencyCode: FiatCurrency
}

// TODO Rename to CreateTransactionResponse
export interface TransactionResponse {
  txHash: string
  transactionFee?: string
}

export interface TransactionResponseERC_20 {
  hex: string
  view_in_explorer?: string
}

export interface ExchangeHoldingsTransfer {
  toAddress: string
  amount: number
  memo?: string
  /**
   * The maximum amount of fee that it is acceptable to pay for the transaction.
   * This is used mostly for withdrawals where we want to make sure kinesis remains profitable.
   */
  feeLimit?: number
  /**
   * The increment that Kinesis want to add when calculation the fee to be paid (based on current average transaction fees),
   *  in order to stay ahead of the competition (priority-wise).
   */
  transactionFeeIncrement?: number
}

export interface OnChainCurrencyGateway {
  ticker?: CurrencyCode
  getId(): Promise<number>

  // This returns a string due to JS floats
  balanceAt(address: string, contract?: string): Promise<number>
  generateAddress(): Promise<CryptoAddress>
  getTransaction(transactionHash: string, targetAddress: string): Promise<Transaction | null>
  createAddressTransactionSubscription(depositAddressDetails: DepositAddress): Promise<boolean>
  subscribeToTransactionConfirmationEvents(transactionHash: string, callbackUrl: string): Promise<void>

  /**
   * Retrieves n block(different for each implementation) retrieving all transactions to a given account
   * @param address the public address
   * @param recordedTransactionHashesForAddress the transaction hashes previously recorded into the account
   */
  getDepositTransactions(address: string, recordedTransactionHashesForAddress?: string | string[]): Promise<DepositTransaction[]>
  getLatestTransactions(lastSeenTransactionHash?: string | string[]): Promise<DepositTransaction[]>
  getHoldingBalance(): Promise<number>
  getHoldingPublicAddress(): Promise<string>
  checkConfirmationOfTransaction(txHash: string): Promise<boolean>

  /**
   * Transfers a given amount from an address to the kinesis holdings account for the coin.
   *
   * @param fromAddress the address to transfer to the holdings account from
   * @param amount the amount to transfer
   * @param feeLimit the maximum fee that Kinesis is willing to pay
   * @param transactionFeeIncrement the increment that Kinesis want to add when calculation the fee to be paid in order to stay ahead of the competition (priority-wise).
   */
  transferToExchangeHoldingsFrom(
    fromAddress: CryptoAddress | Pick<CryptoAddress, 'privateKey'>,
    amount: number,
    feeLimit?: number,
    transactionFeeIncrement?: number,
  ): Promise<TransactionResponse>
  transferFromExchangeHoldingsTo(params: ExchangeHoldingsTransfer): Promise<TransactionResponse>
  kinesisManagesConfirmations(): boolean
  transferTo(parameters: { privateKey: string; amount: number; toAddress: string; signerKey?: string }): Promise<TransactionResponse>
  validateAddress(address: string): Promise<boolean>
  validateAddressIsNotContractAddress(address: string): Promise<boolean>
  getDecryptedHoldingsSecret(privateKey: string, currencySecret: string): Promise<string>
}
