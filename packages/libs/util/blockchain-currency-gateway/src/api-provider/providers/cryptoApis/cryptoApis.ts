import caClient from 'cryptoapis.io'
import { CurrencyCode } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'

import {
  ENetworkTypes,
  ICryptoApiClient,
  IAddressTransactionRequest,
  IAddressTransaction,
  ITransactionConfirmationsRequest,
  ITransactionConfirmations,
  IConfirmationTransactionRequest,
  IConfirmationTransaction,
  ITransactionDetailsRequest,
  ITransactionDetails,
  IGenerateAddress,
  IAddressDetailsRequest,
  IAddressDetails,
  ITransactionSizeRequest,
  ISignTransactionRequest,
  ICreateTransactionRequest,
  ISendTransactionRequest,
  ICoin,
  ITransactionsFee,
  ITransactionSize,
  ISignTransaction,
  ICreateTransaction,
  ISendTransaction,
} from './model'

export class CryptoApis {
  private logger: Logger
  private caClientInteraction: ICryptoApiClient
  private ticker: CurrencyCode
  constructor(ticker: CurrencyCode, network: ENetworkTypes, token: string) {
    this.ticker = ticker
    this.caClientInteraction = new caClient(token)(this.caClientInteraction.BC[this.ticker] as ICoin).switchNetwork(
      this.caClientInteraction.BC[this.ticker].NETWORKS[network],
    )
    this.logger = Logger.getInstance('CryptoApis', this.ticker)
  }

  /**
   * Generate a new address
   */
  public generateAddress = async (): Promise<IGenerateAddress> => {
    this.logger.debug('Generating new address')
    return (await (this.caClientInteraction.BC[this.ticker] as ICoin).address.generateAddress()).payload
  }

  /**
   * Set up a webhook for addresses to listen for any transactions that happen related to those addresses.
   */
  public addressEventSubscription = async ({ callbackURL, address, confirmations }: IAddressTransactionRequest): Promise<IAddressTransaction> => {
    this.logger.debug(`Creating new address hook for address: ${address}`)
    return (await (this.caClientInteraction.BC[this.ticker] as ICoin).webhook.createAddressTransactionWebHook(callbackURL, address, confirmations))
      .payload
  }

  /**
   * Set up a webhook to listen on a transaction and be updated when the confirmations are updated
   */
  public transactionConfirmationEventSubscription = async ({
    callbackURL,
    address,
    confirmations,
  }: ITransactionConfirmationsRequest): Promise<ITransactionConfirmations> => {
    this.logger.debug(`Creating new confirmation hook for address: ${address}`)
    return (
      await (this.caClientInteraction.BC[this.ticker] as ICoin).webhook.createTransactionConfirmationsWebHook(callbackURL, address, confirmations)
    ).payload
  }

  /**
   * Set up a webhook to listen on a transaction and be updated when it is confirmed
   */
  public confirmedTransactionEventSubscription = async ({
    callbackURL,
    transactionHash,
    confirmations,
  }: IConfirmationTransactionRequest): Promise<IConfirmationTransaction> => {
    this.logger.debug(`Creating new confirmed transaction hook for address: ${transactionHash}`)
    return (
      await (this.caClientInteraction.BC[this.ticker] as ICoin).webhook.createConfirmedTransactionWebHook(callbackURL, transactionHash, confirmations)
    ).payload
  }

  /**
   * Using a tx hash we can grab all the transaction details
   */
  public getTransactionDetails = async ({ txID }: ITransactionDetailsRequest): Promise<ITransactionDetails> => {
    this.logger.debug(`Grabbing transaction details from txid: ${txID}`)
    return (await (this.caClientInteraction.BC[this.ticker] as ICoin).transactions.getTransaction(txID)).payload
  }

  /**
   * Get an addresses detail.
   */
  public getAddressDetails = async ({ publicKey }: IAddressDetailsRequest): Promise<IAddressDetails> => {
    this.logger.debug(`Grabbing address details for publicKey: ${publicKey}`)
    return (await (this.caClientInteraction.BC[this.ticker] as ICoin).address.getInfo(publicKey)).payload
  }

  /**
   * Grab the current details of the transaction fees on the network. This will help decide what fee's to use
   */
  public getTransactionsFee = async (): Promise<ITransactionsFee> => {
    this.logger.debug(`Grabbing transaction fee details for network`)
    return (await (this.caClientInteraction.BC[this.ticker] as ICoin).transactions.getTransactionsFee()).payload
  }

  /**
   * Grab the potential transaction size
   */
  public getTransactionSize = async ({ inputs, outputs, fee }: ITransactionSizeRequest): Promise<ITransactionSize> => {
    this.logger.debug(
      `Grabbing transaction size. inputs: ${JSON.stringify(inputs)}, outputs: ${JSON.stringify(outputs)}, fee: ${JSON.stringify(fee)}`,
    )
    return (await (this.caClientInteraction.BC[this.ticker] as ICoin).transactions.getTransactionSize(inputs, outputs, fee)).payload
  }

  /**
   * Sign a transaction using wif accounts
   */
  public signTransaction = async ({ hex, wifs }: ISignTransactionRequest): Promise<ISignTransaction> => {
    this.logger.debug(`Signing transaction: ${hex} with accounts: ${JSON.stringify(wifs)}`)
    return (await (this.caClientInteraction.BC[this.ticker] as ICoin).transactions.signTransaction(hex, wifs)).payload
  }
  /**
   * Create the transaction hash
   */
  public createTransaction = async ({ inputs, outputs, fee }: ICreateTransactionRequest): Promise<ICreateTransaction> => {
    this.logger.debug(`Create transaction with - inputs: ${JSON.stringify(inputs)}, outputs: ${JSON.stringify(outputs)}, fee: ${JSON.stringify(fee)}`)
    return (await (this.caClientInteraction.BC[this.ticker] as ICoin).transactions.createTransaction(inputs, outputs, fee)).payload
  }
  /**
   * Once the transaction is completed. Send it
   */
  public sendTransaction = async ({ hex }: ISendTransactionRequest): Promise<ISendTransaction> => {
    this.logger.debug(`Send transaction: ${hex}`)
    return (await (this.caClientInteraction.BC[this.ticker] as ICoin).transactions.sendTransaction(hex)).payload
  }
}
