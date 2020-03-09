import { EthereumFacade, ERC_20Facade } from '../EthereumFacade'
import { TransactionResponse, TransactionResponseERC_20 } from '../../currency_gateway'
import { Environment, CurrencyCode } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'
import { CreateEthTransactionPayload, CreateERC_20TransactionPayload} from '../model/CreateTransactionPayload'
import { EthereumTransactionDispatcher,ERC_20TransactionDispatcher } from './EthereumTransactionDispatcher'
import { CryptoApisProviderProxyEth, ENetworkTypes, IAddressTransactionEth } from '../providers/crypto-apis'
import { Transaction, CryptoAddress } from '../model'

export const mainnetEnvironments = [Environment.production]

export class EthereumBlockchainFacade implements EthereumFacade {
  private readonly LOGGER = Logger.getInstance('blockchain-currency-gateway', 'EthereumBlockchainFacade')
  
  private cryptoApiProviderProxyEth: CryptoApisProviderProxyEth
  private EthereumTransactionDispatcher: EthereumTransactionDispatcher

  constructor() {
    this.cryptoApiProviderProxyEth = new CryptoApisProviderProxyEth (
      CurrencyCode.ethereum,
      mainnetEnvironments.includes(process.env.NODE_ENV as Environment) ? ENetworkTypes.MAINNET : ENetworkTypes.TESTNET,
      process.env.CRYPTO_APIS_TOKEN!,
      
    )

    this.EthereumTransactionDispatcher = new EthereumTransactionDispatcher(this.cryptoApiProviderProxyEth)
  }

  createTransaction(params: CreateEthTransactionPayload): Promise<TransactionResponse> {
    this.LOGGER.debug(`Creating transaction of ${params.value} from ${params.fromAddress} to ${params.toAddress}`)

    return this.EthereumTransactionDispatcher.createTransaction(params)
  }

  async getTransaction(transactionHash: string): Promise<Transaction> {
    const transactionDetails = await this.cryptoApiProviderProxyEth.getTransactionDetails({ TX_HASH: transactionHash })

    return {
      transactionHash: transactionDetails.hash,
    }
  }
  async generateAddress(): Promise<CryptoAddress> {
    const generatedAddress = await this.cryptoApiProviderProxyEth.generateAddress()

    this.cryptoApiProviderProxyEth.createAddressTransactiontEventSubscription({
      address: generatedAddress.publicKey,
      callbackURL: `${process.env.API_URL}/webhooks/crypto/address-transactions`,
      confirmations: 2,
    })

    return generatedAddress
  }

  async addressEventListener(publicKey: string): Promise<IAddressTransactionEth> {
    return this.cryptoApiProviderProxyEth.createAddressTransactiontEventSubscription({
      address: publicKey,
      callbackURL: `${process.env.API_URL}/webhooks/crypto/address-transactions`,
      confirmations: 0,
    })
  }

  async balanceAt(address: string): Promise<number> {
    const addressDetails = await this.cryptoApiProviderProxyEth.getAddressDetails({ address: address })

    return Number(addressDetails.balance)
  }

  async validateAddress(address: string): Promise<boolean> {
    try {
      const addressDetails = await this.cryptoApiProviderProxyEth.getAddressDetails({ address: address })
      return addressDetails.address === address
    } catch (e) {
      this.LOGGER.debug(`Unable to retrieve address details for address ${address}`)
      return false
    }
  }

  async validateAddressIsNotContractAddress(address: string): Promise<boolean> {
    return address !== process.env.BTC_CONTRACT_ADDRESS // Revisar
  }

}

export class ERC_20BlockchainFacade implements ERC_20Facade {
  private readonly LOGGER = Logger.getInstance('blockchain-currency-gateway', 'ERC_20BlockchainFacade')

  private cryptoApiProviderProxyEth: CryptoApisProviderProxyEth
  private ERC_20TransactionDispatcher: ERC_20TransactionDispatcher

  constructor() {
    this.cryptoApiProviderProxyEth = new CryptoApisProviderProxyEth (
      CurrencyCode.ethereum,
      mainnetEnvironments.includes(process.env.NODE_ENV as Environment) ? ENetworkTypes.MAINNET : ENetworkTypes.TESTNET,
      process.env.CRYPTO_APIS_TOKEN!,
      
    )
    
    this.ERC_20TransactionDispatcher = new ERC_20TransactionDispatcher(this.cryptoApiProviderProxyEth)
  }

  createTransaction(params: CreateERC_20TransactionPayload): Promise<TransactionResponseERC_20> {
    this.LOGGER.debug(`Creating transaction of ${params.token} from ${params.fromAddress} to ${params.toAddress}`)

    return this.ERC_20TransactionDispatcher.createTransaction(params)
  }

  async getTransactionByAddress(address: string): Promise<Transaction> {
    const transactionDetails = await this.cryptoApiProviderProxyEth.getByAddressDetailsERC_20({ address: address })

    return {
      transactionHash: transactionDetails.payload[0].txHash, // Revisar revisar REVISAR
    }
  }
 
  async addressEventListener(publicKey: string): Promise<IAddressTransactionEth> {
    return this.cryptoApiProviderProxyEth.createAddressTransactiontEventSubscription({
      address: publicKey,
      callbackURL: `${process.env.API_URL}/webhooks/crypto/address-transactions`,
      confirmations: 0,
    })
  }

  async balanceAt(address: string, contract: string): Promise<number> {
    const addressDetails = await this.cryptoApiProviderProxyEth.getAddressDetailsERC_20({ address: address, contract: contract})

    return Number(addressDetails.token)
  }

  async validateAddress(address: string): Promise<boolean> {
    try {
      const addressDetails = await this.cryptoApiProviderProxyEth.getAddressDetails({ address: address })
      return addressDetails.address === address
    } catch (e) {
      this.LOGGER.debug(`Unable to retrieve address details for address ${address}`)
      return false
    }
  }

  async validateAddressIsNotContractAddress(address: string): Promise<boolean> {
    return address !== process.env.BTC_CONTRACT_ADDRESS // Revisar
  }



}

