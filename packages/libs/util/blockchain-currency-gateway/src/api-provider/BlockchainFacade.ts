import { CreateTransactionPayload, CryptoAddress, Transaction } from './model'
import { TransactionResponse } from '../currency_gateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { BitcoinBlockchainFacade } from './bitcoin/BitcoinBlockchainFacade'
import { IAddressTransaction } from './providers/crypto-apis'

/** The main mechanism for conducting blockchain operations. */
export abstract class BlockchainFacade {
  /**
   * Creates a new transaction and broadcasts it to the chain.
   *
   * @param senderAddress the full sender crypto address detials
   * @param receiverPublicAddress the receiver public address details
   * @param amount the amount to send
   */
  abstract createTransaction(payload: CreateTransactionPayload): Promise<TransactionResponse>

  /**
   * Retrieves the transaction details for a given hash
   * @param transactionHash transaction identifier
   */
  abstract getTransaction(transactionHash: string): Promise<Transaction>

  /** Generates a new address. */
  abstract generateAddress(): Promise<CryptoAddress>

  /** A call made to listen on the specified address */
  abstract subscribeToAddressTransactionEvents(address: string, confirmations): Promise<IAddressTransaction>

  /**
   * Validates if the input address is a valid blockchain address.
   * @param address the address
   */
  abstract validateAddress(address: string): Promise<boolean>

  /**
   * Returns true when the address is no a contract address.
   * @param address the address to validate
   */
  abstract validateAddressIsNotContractAddress(address: string): Promise<boolean>

  /**
   * Returns true when the address is no a contract address.
   * @param address the address to validate
   */
  abstract validateAddressIsNotContractAddress(address: string): Promise<boolean>

  /**
   * Subscribes for transaction confirmation for a given transaction hash. The confirmation count is defined by the implementation.
   *
   * @param transactionHash the transaction id/hash
   * @param callbackURL the callback URL to invoke on transaction confirmation
   */
  abstract subscribeToTransactionConfirmationEvents(transactionHash: string, callbackURL: string): Promise<{ alreadyConfirmed: boolean }>

  /**
   * Returns the {@link BlockchainFacade} implementation instance based on the coin passed in.
   * @param currency the currency to retrieve the implementation for
   */
  public static getInstance(currency: CurrencyCode) {
    if (currency === CurrencyCode.bitcoin) {
      return new BitcoinBlockchainFacade()
    }

    throw new Error(`Unsupported currency for BlockchainFacade ${currency}`)
  }
}
