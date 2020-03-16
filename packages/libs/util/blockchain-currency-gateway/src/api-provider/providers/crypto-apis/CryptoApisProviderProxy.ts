import * as CryptoApiModel from './model'

export interface CryptoApisProviderProxy {
  /**
   * Generate a new address
   */
  generateAddress(): Promise<CryptoApiModel.IGenerateAddress>

  /**
   * Set up a webhook for addresses to listen for any transactions that happen related to those addresses.
   */
  createAddressTransactiontEventSubscription({
    callbackURL,
    address,
    confirmations,
  }: CryptoApiModel.IAddressTransactionRequest): Promise<CryptoApiModel.IAddressTransaction>

  /**
   * Set up a webhook to listen on a transaction and be updated when the confirmations are updated
   */
  createAddressTransactionConfirmationEventSubscription({
    callbackURL,
    address,
    confirmations,
  }: CryptoApiModel.IAddressTransactionConfirmationsWebhookRequest): Promise<CryptoApiModel.IAddressTransactionConfirmations>

  /**
   * Set up a webhook to listen on a transaction and be updated when it is confirmed
   */
  createConfirmedTransactionEventSubscription({
    callbackURL,
    transactionHash,
    confirmations,
  }: CryptoApiModel.IConfirmedTransactionWebhookRequest): Promise<CryptoApiModel.IConfirmedTransaction>

  /**
   * Using a tx hash we can grab all the transaction details
   */
  getTransactionDetails(request: CryptoApiModel.ITransactionDetailsRequest): Promise<CryptoApiModel.ITransactionDetails>

  /**
   * Get an addresses detail.
   */
  getAddressDetails(addressDetailsRequest: CryptoApiModel.IAddressDetailsRequest): Promise<CryptoApiModel.IAddressDetails>

  /**
   * Grab the current details of the transaction fees on the network. This will help decide what fee's to use
   */
  getTransactionsFee(): Promise<CryptoApiModel.ITransactionsFee>

  /**
   * Creates a transaction object, using the provided details.
   */
  createTransaction(request: CryptoApiModel.CreateTransactionRequest): Promise<CryptoApiModel.CreateTransactionResponsePayload>

  /**
   * Broadcasts the transaction on the exchange.
   */
  broadcastTransaction(signedTransactionHex: string): Promise<CryptoApiModel.IBroadcastTransactionResponsePayload>
}
