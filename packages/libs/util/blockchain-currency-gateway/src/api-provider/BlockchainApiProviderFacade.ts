import { CreateTransactionPayload, CryptoAddress, Transaction } from '../model'
import { TransactionResponse } from '../currency_gateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { BitcoinApiProviderFacade } from '../bitcoin/BitcoinApiProviderFacade'
import { IAddressTransaction } from './crypto-apis'

/** The main mechanism for conducting blockchain operations. */
export abstract class BlockchainApiProviderFacade {
  private static currencyFacades: Map<CurrencyCode, BlockchainApiProviderFacade> = new Map()

  /**
   * Retrieves the available balance at a given address.
   *
   * @param address the address to retrieve the details for
   * @param contract the ERC20 contract address
   */
  abstract getAddressBalance(address: string, contract?: string): Promise<number>

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
   * @param targetAddress the transaction target address
   */
  abstract getTransaction(transactionHash: string, targetAddress: string): Promise<Transaction | null>

  /** Generates a new address. */
  abstract generateAddress(): Promise<CryptoAddress>

  /** A call made to listen on the specified address */
  abstract subscribeToAddressTransactionEvents(address: string, confirmations: number): Promise<IAddressTransaction>

  /**
   * Validates if the input address is a valid blockchain address.
   * @param address the address
   */
  abstract validateAddress(address: string): Promise<boolean>

  /**
   * Subscribes for transaction confirmation for a given transaction hash. The confirmation count is defined by the implementation.
   *
   * @param transactionHash the transaction id/hash
   * @param callbackURL the callback URL to invoke on transaction confirmation
   */
  abstract subscribeToTransactionConfirmationEvents(transactionHash: string, callbackURL: string): Promise<void>

  /**
   * Returns the {@link BlockchainFacade} implementation instance based on the coin passed in.
   * @param currency the currency to retrieve the implementation for
   */
  public static getInstance(currency: CurrencyCode) {
    if (currency === CurrencyCode.bitcoin) {
      let existingFacade = this.currencyFacades.get(currency)

      if (!existingFacade) {
        existingFacade = new BitcoinApiProviderFacade()
        this.currencyFacades.set(currency, existingFacade)
      }

      return existingFacade
    }

    throw new Error(`Unsupported currency for BlockchainFacade ${currency}`)
  }
}
