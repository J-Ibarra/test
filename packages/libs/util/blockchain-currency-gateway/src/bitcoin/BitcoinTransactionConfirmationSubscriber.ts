import { EndpointInvocationUtils, IConfirmedTransaction, BtcCryptoApisProviderProxy } from '../api-provider'
import { Logger } from '@abx-utils/logging'
import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'
import util from 'util'

export class BitcoinTransactionConfirmationSubscriber {
  private readonly LOGGER = Logger.getInstance('blockchain-currency-gateway', 'BitcoinTransactionConfirmationSubscriber')
  constructor(private cryptoApisProviderProxy: BtcCryptoApisProviderProxy) {}

  /**
   * Creates a transaction confirmation webhook using {@link BlockchainFacadeUtils.invokeEndpointWithProgressiveRetry} to
   * progressive retry on unsuccessful registration response.
   *
   * If, regardless of the retry mechanism, webhook registration fails. A message is pushed to {@code webhookRegistrationFailureUrl} (SQS URL for aws environments).
   *
   * @param transactionHash the created transaction hash
   * @param webhookCallbackUrl the URL where the webhook notification is pushed
   * @param webhookRegistrationFailureUrl the URL where a message is pushed if the confirmed transaction webhook registration fails
   */
  public async createTransactionConfirmationWebhook(
    transactionHash: string,
    webhookCallbackUrl: string,
    webhookRegistrationFailureUrl: string,
    transactionConfirmations?: number,
  ) {
    try {
      const { confirmations, created } = await EndpointInvocationUtils.invokeEndpointWithProgressiveRetry<IConfirmedTransaction>({
        name: 'createConfirmedTransactionWebHook',
        endpointInvoker: () =>
          this.cryptoApisProviderProxy.createConfirmedTransactionEventSubscription({
            callbackURL: webhookCallbackUrl,
            transactionHash,
            confirmations: transactionConfirmations || Number(process.env.BITCOIN_TRANSACTION_CONFIRMATION_BLOCKS),
          }),
      })

      this.LOGGER.debug(`Successfully created confirmed transaction webhook for ${transactionHash}. Confirmation: ${confirmations}, ${created}`)
    } catch (e) {
      const errorMessage = `An error has ocurred while trying to subscribe for transaction confirmation webhook for ${transactionHash}`
      this.LOGGER.error(`${errorMessage} ${JSON.stringify(util.inspect(e))}`)

      await sendAsyncChangeMessage({
        type: 'createTransactionConfirmationWebhook-failure',
        target: {
          local: 'createTransactionConfirmationWebhook-failure-local',
          deployedEnvironment: webhookRegistrationFailureUrl,
        },
        payload: {
          transactionHash,
        },
      })
    }
  }
}
