import { CryptoAddress, Transaction ,CreateEthTransactionPayload, CreateERC_20TransactionPayload} from './model'
import { TransactionResponse, TransactionResponseERC_20 } from '../currency_gateway'
import { IAddressTransactionEth } from './providers/crypto-apis'

/** The main mechanism for conducting blockchain operations. */
export interface EthereumFacade {
    /**
     * Creates a new transaction and broadcasts it to the chain.
     *
     * @param senderAddress the full sender crypto address detials
     * @param receiverPublicAddress the receiver public address details
     * @param amount the amount to send
     */
    createTransaction(payload: CreateEthTransactionPayload): Promise<TransactionResponse>
  
    /**
     * Retrieves the transaction details for a given hash
     * @param transactionHash transaction identifier
     */
    getTransaction(transactionHash: string): Promise<Transaction>
  
    /** Generates a new address. */
    generateAddress(): Promise<CryptoAddress>
  
   /** A call made to listen on the specified address */
   addressEventListener(publicKey: string): Promise<IAddressTransactionEth>

    /**
     * Validates if the input address is a valid blockchain address.
     * @param address the address
     */
    validateAddress(address: string): Promise<boolean>
  
   /**
   *
   * @param address
   */
  validateAddressIsNotContractAddress(address: string): Promise<boolean>
  
  }

  export interface ERC_20Facade {
    /**
     * Creates a new transaction and broadcasts it to the chain.
     *
     * @param senderAddress the full sender crypto address detials
     * @param receiverPublicAddress the receiver public address details
     * @param amount the amount to send
     */
    createTransaction(payload: CreateERC_20TransactionPayload): Promise<TransactionResponseERC_20>
  
    /**
     * Retrieves the transaction details for a given hash
     * @param address transaction identifier
     */
    getTransactionByAddress(address: string): Promise<Transaction>
    
   /** A call made to listen on the specified address */
   addressEventListener(publicKey: string): Promise<IAddressTransactionEth>

    /**
     * Validates if the input address is a valid blockchain address.
     * @param address the address
     */
    validateAddress(address: string): Promise<boolean>
  
   /**
   *
   * @param address
   */
  validateAddressIsNotContractAddress(address: string): Promise<boolean>
  
  }
  