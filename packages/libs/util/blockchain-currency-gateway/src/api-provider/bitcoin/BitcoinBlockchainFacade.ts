import { BlockchainFacade } from '../BlockchainFacade'
import { TransactionResponse } from '../../currency_gateway'
import { Environment, CurrencyCode } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'

import { CreateTransactionPayload } from '../model/CreateTransactionPayload'
import { BitcoinTransactionDispatcher } from './BitcoinTransactionDispatcher'
import { CryptoApisProviderProxy, ENetworkTypes } from '../providers/crypto-apis'
import { Transaction, CryptoAddress } from '../model'

export const mainnetEnvironments = [Environment.production]

export class BitcoinBlockchainFacade implements BlockchainFacade {
  private readonly LOGGER = Logger.getInstance('blockchain-currency-gateway', 'BitcoinBlockchainFacade')

  private cryptoApiProviderProxy: CryptoApisProviderProxy
  private bitcoinTransactionDispatcher: BitcoinTransactionDispatcher

  constructor() {
    this.cryptoApiProviderProxy = new CryptoApisProviderProxy(
      CurrencyCode.bitcoin,
      mainnetEnvironments.includes(process.env.NODE_ENV as Environment) ? ENetworkTypes.MAINNET : ENetworkTypes.TESTNET,
      process.env.CRYPTO_APIS_TOKEN!,
    )

    this.bitcoinTransactionDispatcher = new BitcoinTransactionDispatcher(this.cryptoApiProviderProxy)
  }

  createTransaction(params: CreateTransactionPayload): Promise<TransactionResponse> {
    this.LOGGER.debug(`Creating transaction of ${params.amount} from ${params.senderAddress.address} to ${params.receiverAddress}`)

    return this.bitcoinTransactionDispatcher.createTransaction(params)
  }

  async getTransaction(transactionHash: string): Promise<Transaction> {
    const transactionDetails = await this.cryptoApiProviderProxy.getTransactionDetails({ txID: transactionHash })

    return {
      transactionHash: transactionDetails.txid,
    }
  }

  async generateAddress(): Promise<CryptoAddress> {
    const generatedAddress = await this.cryptoApiProviderProxy.generateAddress()

    this.cryptoApiProviderProxy.createAddressTransactiontEventSubscription({
      address: generatedAddress.publicKey,
      callbackURL: `${process.env.API_URL}/webhooks/crypto/address-transactions`,
      confirmations: 2,
    })

    return generatedAddress
  }

  async balanceAt(address: string): Promise<number> {
    const addressDetails = await this.cryptoApiProviderProxy.getAddressDetails({ publicKey: address })

    return Number(addressDetails.balance)
  }

  async validateAddress(address: string): Promise<boolean> {
    try {
      const addressDetails = await this.cryptoApiProviderProxy.getAddressDetails({ publicKey: address })
      return addressDetails.address === address
    } catch (e) {
      this.LOGGER.debug(`Unable to retrieve address details for address ${address}`)
      return false
    }
  }

  async validateAddressIsNotContractAddress(address: string): Promise<boolean> {
    return address !== process.env.BTC_CONTRACT_ADDRESS
  }
}
