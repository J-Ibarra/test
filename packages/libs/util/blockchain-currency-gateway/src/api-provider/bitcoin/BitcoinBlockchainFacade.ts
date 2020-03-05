import { BlockchainFacade } from '../BlockchainFacade'
import { TransactionResponse } from '../../currency_gateway'
import { Environment, CurrencyCode } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'

import { CreateTransactionPayload } from '../model/CreateTransactionPayload'
import { BitcoinTransactionDispatcher } from './BitcoinTransactionDispatcher'
import { CryptoApisProviderProxy, ENetworkTypes, IAddressTransaction } from '../providers/crypto-apis'
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

  async getTransaction(transactionHash: string, targetAddress: string): Promise<Transaction> {
    const { txid, txouts, txins, time, confirmations } = await this.cryptoApiProviderProxy.getTransactionDetails({ txID: transactionHash })
    const txOutForTargetAddress = txouts.find(({ addresses }) => addresses.includes(targetAddress))

    return {
      transactionHash: txid,
      receiverAddress: txouts[0].addresses[0],
      senderAddress: txins[0].addresses[0],
      amount: Number(txOutForTargetAddress!.amount),
      time: time,
      confirmations,
    }
  }

  async generateAddress(): Promise<CryptoAddress> {
    const generatedAddress = await this.cryptoApiProviderProxy.generateAddress()
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

  async subscribeToTransactionConfirmationEvents(transactionHash: string, callbackURL: string): Promise<void> {
    try {
      await this.cryptoApiProviderProxy.createConfirmedTransactionEventSubscription({
        callbackURL,
        confirmations: Number(process.env.BITCOIN_TRANSACTION_CONFIRMATION_BLOCKS),
        transactionHash,
      })
    } catch (e) {
      this.LOGGER.error(`Error ocurred when subscribing for transaction confirmations for ${transactionHash}`)
      this.LOGGER.error(`${JSON.stringify(e)}`)
      throw e
    }
  }

  subscribeToAddressTransactionEvents(publicKey: string, confirmations: number): Promise<IAddressTransaction> {
    return this.cryptoApiProviderProxy.createAddressTransactiontEventSubscription({
      address: publicKey,
      callbackURL: process.env.DEPOSIT_ADDRESS_UNCONFIRMED_TRANSACTION_CALLBACK_URL!,
      confirmations,
    })
  }
}
