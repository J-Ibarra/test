import { CurrencyCode, FiatCurrency } from '@abx-types/reference-data'
import { CryptoAddress } from './api-provider/model'
import { DepositAddress } from '@abx-types/deposit'

export interface DepositTransaction {
  txHash: string
  amount: number
  from: string
  to?: string
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

export interface ExchangeHoldingsTransfer {
  toAddress: string
  amount: number
  memo?: string
  feeLimit?: number
  /** Defines if a transaction confirmation web-hook to the {@code callbackUrl} should be created. */
  transactionConfirmationWebhookUrl?: string
  /** The transaction confirmations for specify when creating the transaction confirmations webhook. */
  transactionConfirmations?: number
}

export interface OnChainCurrencyGateway {
  ticker?: CurrencyCode
  getId(): Promise<number>

  // This returns a string due to JS floats
  balanceAt(address: string): Promise<number>
  generateAddress(): Promise<CryptoAddress>
  createAddressTransactionSubscription(depositAddressDetails: DepositAddress): Promise<boolean>
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
  transferToExchangeHoldingsFrom(
    fromAddress: CryptoAddress | Pick<CryptoAddress, 'privateKey'>,
    amount: number,
    transactionConfirmationWebhookUrl?: string,
  ): Promise<TransactionResponse>
  transferFromExchangeHoldingsTo(params: ExchangeHoldingsTransfer): Promise<TransactionResponse>
  kinesisManagesConfirmations(): boolean
  transferTo(parameters: { privateKey: string; amount: number; toAddress: string; signerKey?: string }): Promise<TransactionResponse>
  validateAddress(address: string): Promise<boolean>
  validateAddressIsNotContractAddress(address: string): Promise<boolean>
  getDecryptedHoldingsSecret(privateKey: string, currencySecret: string): Promise<string>
}
