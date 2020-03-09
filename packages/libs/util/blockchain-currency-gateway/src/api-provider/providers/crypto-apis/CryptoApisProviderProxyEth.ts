import caClient from 'cryptoapis.io'
import { CurrencyCode } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'

import * as CryptoApiModel from './model'
import { getExcludedAccountTypesFromOrderRangeValidations } from '@abx-service-clients/reference-data'

export class CryptoApisProviderProxyEth {
  private logger: Logger
  private caClientInteraction: CryptoApiModel.ICryptoApiClient
  private ticker: CurrencyCode

  constructor(ticker: CurrencyCode, network: CryptoApiModel.ENetworkTypes, token: string) {
    this.ticker = ticker
    this.caClientInteraction = new caClient(token)

    this.logger = Logger.getInstance('CryptoApisProviderProxyEth', this.ticker)

    this.caClientInteraction.BC[this.ticker].switchNetwork(network)
  }

  /**
   * Generate a new address
   */
  public generateAddress = async (): Promise<CryptoApiModel.IGenerateAddress> => {
    this.logger.debug('Generating new address')

    return (await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.IEth).address.generateAddress()).payload
  }

  /**
   * Grab the current details of the transaction fees on the network. This will help decide what fee's to use
   */
  public getTransactionsFee = async (): Promise<CryptoApiModel.IEthTransactionsFee> => {
    this.logger.debug(`Grabbing transaction fee details for network`)

    return (await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.IEth).transaction.getTransactionsFee()).payload
  }

  public estimateTransactionGas = async (fromAddress: string,toAddress: string,value: number): Promise<CryptoApiModel.IEthTransactionsGas> => {
    this.logger.debug(`Grabbing transaction fee details for network`)

    return (await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.IEth).transaction.estimateTransactionGas(fromAddress,toAddress,value)).payload
  }

   /**
   * Creates a transaction object, using the provided details.
   */
  public createTransaction = async (
    fromAddress: string,
    toAddress: string,
    value: number,
    gasPrice: number,
    gasLimit: number,
    password?: string,
    ): Promise<CryptoApiModel.CreateTransactionResponsePayload> => {
    return (await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.IEth).transaction.createTransaction(fromAddress, toAddress, value, gasPrice, gasLimit, password)).payload
  }
  /**
   * Creates a transaction ERC_20, using the provided details.
   */
  public createTransactionERC_20 = async (
    fromAddress: string,
    toAddress: string,
    gasPrice: number,
    gasLimit: number,
    token: number,
    contract: string,
    password?: string,
    ): Promise<CryptoApiModel.CreateTransactionResponsePayload> => {
    return (await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.IEth).token.transferTokens(fromAddress, toAddress,gasPrice, gasLimit,token,contract, password)).payload
  }
  
  /**
   * Broadcasts the transaction on the exchange.
   */
  // sendTransaction
  public broadcastTransaction = async (hex: string): Promise<CryptoApiModel.BroadcastTransactionResponsePayloadEth> => {
    return (await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.IEth).transaction.pushTransaction(hex)).payload
  }

   /**
   * Using a tx hash we can grab all the transaction details
   */
  public getTransactionDetails = async ({ TX_HASH }: CryptoApiModel.ITransactionDetailsRequestEth): Promise<CryptoApiModel.IEthereumTransactionDetails> => {
    this.logger.debug(`Grabbing transaction details from hash: ${TX_HASH}`)

    return (await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.IEth).transaction.getTransaction(TX_HASH)).payload
  }

  

  /**
   * Get an addresses detail.
   */
  public getAddressDetails = async ({ address }: CryptoApiModel.IAddressDetailsRequestEth): Promise<CryptoApiModel.IAddressDetailsEth> => {
    this.logger.debug(`Grabbing address details for publicKey: ${address}`)

    return (await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.IEth).address.getInfo(address)).payload
  }

  /**
   * Get an addresses detail.
   */
  public getByAddressDetailsERC_20 = async ({ address }: CryptoApiModel.IAddressDetailsRequestEth): Promise<CryptoApiModel.IAddressDetailsERC_20> => {
    this.logger.debug(`Grabbing address details for publicKey: ${address}`)

    return (await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.IEth).token.getTokenTransactionsByAddress(address)).payload
  }

  /**
   * Get an addresses detail.
   */
  public getAddressDetailsERC_20 = async ({ address, contract }: CryptoApiModel.IAddressDetailsRequestEth): Promise<CryptoApiModel.IAddressBalanceERC_20> => {
    this.logger.debug(`Grabbing address details for publicKey: ${address}`)

    return (await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.IEth).token.getAddressTokenBalance(address, contract!)).payload
  }

  /**
   * Set up a webhook to listen on a transaction and be updated when it is confirmed
   */
  public createConfirmedTransactionEventSubscription = async ({
    callbackURL,
    transactionHash,
    confirmations,
  }: CryptoApiModel.IConfirmedTransactionWebhookRequestEth): Promise<CryptoApiModel.IConfirmedTransactionEth> => {
    this.logger.debug(`Creating new confirmed transaction hook for address: ${transactionHash}`)

    return (
      await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.IEth).webhook.createConfirmedTransactionWebHook(
        callbackURL,
        transactionHash,
        confirmations
      )
    ).payload
  }
  
  /**
   * Set up a webhook for addresses to listen for any transactions that happen related to those addresses.
   */
  public createAddressTransactiontEventSubscription = async ({
    callbackURL,
    address,
    confirmations,
  }: CryptoApiModel.IAddressTransactionRequestEth): Promise<CryptoApiModel.IAddressTransactionEth> => {
    this.logger.debug(`Creating new address transaction hook for address: ${address}`)

    return (
      await (this.caClientInteraction.BC[this.ticker] as CryptoApiModel.IEth).webhook.createAddressTransactionWebHook(
        callbackURL,
        address,
        confirmations
      )
    ).payload
  }

}