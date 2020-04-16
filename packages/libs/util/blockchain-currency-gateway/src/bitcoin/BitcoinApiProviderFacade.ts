import { BlockchainApiProviderFacade } from '../api-provider'
import { TransactionResponse } from '../currency_gateway'
import { Environment, CurrencyCode } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'

import {
  Transaction,
  CryptoAddress,
  SingleTargetCreateTransactionPayload,
  MultiTargetCreateTransactionPayload,
  MultiTargetTransactionCreationResult,
} from '../model'
import { BitcoinTransactionDispatcher } from './transaction-dipsatchers/BitcoinTransactionDispatcher'
import { ENetworkTypes, IAddressTransaction } from '../api-provider/crypto-apis'
import { BtcCryptoApisProviderProxy } from '../api-provider'
import { SingleTargetTransactionDispatcher } from './transaction-dipsatchers/single-target/SingleTargetTransactionDispatcher'
import { MultiTargetTransactionDispatcher } from './transaction-dipsatchers/multi-target/MultiTargetTransactionDispatcher'

export const mainnetEnvironments = [Environment.production]

export class BitcoinApiProviderFacade implements BlockchainApiProviderFacade {
  private readonly LOGGER = Logger.getInstance('blockchain-currency-gateway', 'BitcoinApiProviderFacade')

  private cryptoApiProviderProxy: BtcCryptoApisProviderProxy
  private singleTargetTransactionDispatcher: BitcoinTransactionDispatcher
  private multiTargetTransactionDispatcher: BitcoinTransactionDispatcher

  constructor() {
    this.cryptoApiProviderProxy = new BtcCryptoApisProviderProxy(
      CurrencyCode.bitcoin,
      mainnetEnvironments.includes(process.env.NODE_ENV as Environment) ? ENetworkTypes.MAINNET : ENetworkTypes.TESTNET,
      process.env.CRYPTO_APIS_TOKEN!,
    )

    this.singleTargetTransactionDispatcher = new SingleTargetTransactionDispatcher(this.cryptoApiProviderProxy)
    this.multiTargetTransactionDispatcher = new MultiTargetTransactionDispatcher(this.cryptoApiProviderProxy)
  }

  async getAddressBalance(address: string): Promise<number> {
    const addressDetails = await this.cryptoApiProviderProxy.getAddressDetails({ publicKey: address })

    return Number(addressDetails.balance)
  }

  createTransaction(params: SingleTargetCreateTransactionPayload): Promise<TransactionResponse> {
    this.LOGGER.debug(`Creating transaction of ${params.amount} from ${params.senderAddress.address} to ${params.receiverAddress}`)

    return this.singleTargetTransactionDispatcher.createTransaction(params)
  }

  /**
   * Used for batched withdrawals, when we need to dispatch a transaction to multiple addresses.
   *
   * @param params
   */
  createMultiReceiverTransaction(params: MultiTargetCreateTransactionPayload): Promise<MultiTargetTransactionCreationResult> {
    this.LOGGER.debug(
      `Creating a multi receiver transaction ${params.senderAddress.address} to ${JSON.stringify(params.receivers.map(({ address }) => address))}`,
    )

    return this.multiTargetTransactionDispatcher.createTransaction(params) as Promise<MultiTargetTransactionCreationResult>
  }

  async getTransaction(transactionHash: string, targetAddress: string): Promise<Transaction> {
    const { txid, txouts, txins, time, confirmations } = await this.cryptoApiProviderProxy.getTransactionDetails({ txID: transactionHash })
    const receiver = this.getTransactionReceiver(targetAddress, txins, txouts)

    return {
      transactionHash: txid,
      receiverAddress: receiver.addresses[0],
      senderAddress: txins[0].addresses[0],
      amount: Number(receiver!.amount),
      time: time,
      confirmations,
    }
  }

  private getTransactionReceiver(targetAddress: string, txins: any[], txouts: any[]) {
    const isTargetAddressSender = txins.some(({ addresses }) => addresses.includes(targetAddress))
    if (isTargetAddressSender) {
      const txOutsideTargetAddress = txouts.filter(({ addresses }) => !addresses.includes(targetAddress))
      return txOutsideTargetAddress[0]
    } else {
      const txOutForTargetAddress = txouts.find(({ addresses }) => addresses.includes(targetAddress))
      return txOutForTargetAddress ? txOutForTargetAddress : txouts[0]
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
      callbackURL: process.env.DEPOSIT_ADDRESS_TRANSACTION_CALLBACK_URL!,
      confirmations,
    })
  }
}
