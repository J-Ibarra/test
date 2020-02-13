import caClient from 'cryptoapis.io'
import { CurrencyCode } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'

import * as CryptoApiModel from './model'

export class CryptoApisProviderProxy {
  private logger: Logger
  private caClientInteraction: CryptoApiModel.ICryptoApiClient
  private ticker: CurrencyCode

  constructor(ticker: CurrencyCode, network: CryptoApiModel.ENetworkTypes, token: string) {
    this.ticker = ticker
    this.caClientInteraction = new caClient(token)

    this.logger = Logger.getInstance('CryptoApisProviderProxy', this.ticker)

    this.caClientInteraction.BC[this.ticker].switchNetwork(network)
  }

  /**
   * Generate a new address
   */
  public generateAddress = async (): Promise<CryptoApiModel.IGenerateAddress> => {
    this.logger.debug('Generating new address')

    return (await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.ICoin).address.generateAddress()).payload
  }

  /**
   * Set up a webhook for addresses to listen for any transactions that happen related to those addresses.
   */
  public createAddressTransactiontEventSubscription = async ({
    callbackURL,
    address,
    confirmations,
  }: CryptoApiModel.IAddressTransactionRequest): Promise<CryptoApiModel.IAddressTransaction> => {
    this.logger.debug(`Creating new address transaction hook for address: ${address}`)

    return (
      await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.ICoin).webhook.createAddressTransactionWebHook(
        callbackURL,
        address,
        confirmations,
      )
    ).payload
  }

  /**
   * Set up a webhook to listen on a transaction and be updated when the confirmations are updated
   */
  public createAddressTransactionConfirmationEventSubscription = async ({
    callbackURL,
    address,
    confirmations,
  }: CryptoApiModel.IAddressTransactionConfirmationsWebhookRequest): Promise<CryptoApiModel.IAddressTransactionConfirmations> => {
    this.logger.debug(`Creating new transaction confirmation hook for address: ${address}`)

    return (
      await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.ICoin).webhook.createTransactionConfirmationsWebHook(
        callbackURL,
        address,
        confirmations,
      )
    ).payload
  }

  /**
   * Set up a webhook to listen on a transaction and be updated when it is confirmed
   */
  public createConfirmedTransactionEventSubscription = async ({
    callbackURL,
    transactionHash,
    confirmations,
  }: CryptoApiModel.IConfirmedTransactionWebhookRequest): Promise<CryptoApiModel.IConfirmedTransaction> => {
    this.logger.debug(`Creating new confirmed transaction hook for address: ${transactionHash}`)

    return (
      await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.ICoin).webhook.createConfirmedTransactionWebHook(
        callbackURL,
        transactionHash,
        confirmations,
      )
    ).payload
  }

  /**
   * Using a tx hash we can grab all the transaction details
   */
  public getTransactionDetails = async ({ txID }: CryptoApiModel.ITransactionDetailsRequest): Promise<CryptoApiModel.ITransactionDetails> => {
    this.logger.debug(`Grabbing transaction details from txid: ${txID}`)

    return (await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.ICoin).transaction.getTransaction(txID)).payload
  }

  /**
   * Get an addresses detail.
   */
  public getAddressDetails = async ({ publicKey }: CryptoApiModel.IAddressDetailsRequest): Promise<CryptoApiModel.IAddressDetails> => {
    this.logger.debug(`Grabbing address details for publicKey: ${publicKey}`)

    return (await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.ICoin).address.getInfo(publicKey)).payload
  }

  /**
   * Grab the current details of the transaction fees on the network. This will help decide what fee's to use
   */
  public getTransactionsFee = async (): Promise<CryptoApiModel.ITransactionsFee> => {
    this.logger.debug(`Grabbing transaction fee details for network`)

    return (await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.ICoin).transaction.getTransactionsFee()).payload
  }

  /**
   * Grab the potential transaction size
   */
  public getTransactionSize = async ({ inputs, outputs, fee }: CryptoApiModel.ITransactionSizeRequest): Promise<CryptoApiModel.ITransactionSize> => {
    this.logger.debug(
      `Grabbing transaction size. inputs: ${JSON.stringify(inputs)}, outputs: ${JSON.stringify(outputs)}, fee: ${JSON.stringify(fee)}`,
    )

    return (await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.ICoin).transaction.getTransactionSize(inputs, outputs, fee)).payload
  }

  /**
   * Creates a transaction object, using the provided details.
   */
  public createTransaction = async ({
    inputs,
    outputs,
    fee,
  }: CryptoApiModel.IInitialTransactionDetails): Promise<CryptoApiModel.CreateTransactionResponsePayload> => {
    return (await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.ICoin).transaction.createTransaction(inputs, outputs, fee)).payload
  }

  /**
   * Broadcasts the transaction on the exchange.
   */
  public broadcastTransaction = async (signedTransactionHex: string): Promise<CryptoApiModel.BroadcastTransactionResponsePayload> => {
    return (await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.ICoin).transaction.sendTransaction(signedTransactionHex)).payload
  }
}
