import { Transaction } from './model/Transaction'
import { CryptoAddress } from './model/CryptoAddress'

/** The main mechanism for conducting blockchain operations. */
export interface BlockchainFacade {
  /**
   * Creates a new transaction and broadcasts it to the chain.
   *
   * @param senderAddress the full sender crypto address detials
   * @param receiverPublicAddress the receiver public address details
   * @param amount the amount to send
   */
  createTransaction(senderAddress: CryptoAddress, receiverPublicAddress: string, amount: number): Promise<Transaction>

  /**
   * Retrieves the transaction details for a given hash
   * @param transactionHash transaction identifier
   */
  getTransaction(transactionHash: string): Promise<Transaction>

  /** Generates a new address. */
  generateAddress(): Promise<CryptoAddress>
}
