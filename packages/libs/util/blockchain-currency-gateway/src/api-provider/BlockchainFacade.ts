import { CreateTransactionPayload, CryptoAddress, Transaction } from './model'
import { TransactionResponse } from '../currency_gateway'

/** The main mechanism for conducting blockchain operations. */
export interface BlockchainFacade {
  /**
   * Creates a new transaction and broadcasts it to the chain.
   *
   * @param senderAddress the full sender crypto address detials
   * @param receiverPublicAddress the receiver public address details
   * @param amount the amount to send
   */
  createTransaction(payload: CreateTransactionPayload): Promise<TransactionResponse>

  /**
   * Retrieves the transaction details for a given hash
   * @param transactionHash transaction identifier
   */
  getTransaction(transactionHash: string): Promise<Transaction>

  /** Generates a new address. */
  generateAddress(): Promise<CryptoAddress>

  /**
   *
   * @param address
   */
  validateAddress(address: string): Promise<boolean>

  /**
   *
   * @param address
   */
  validateAddressIsNotContractAddress(address: string): Promise<boolean>
}
