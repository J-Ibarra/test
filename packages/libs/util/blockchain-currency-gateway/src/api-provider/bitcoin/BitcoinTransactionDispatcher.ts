import { CryptoAddress, CreateTransactionPayload, ApiProviderError } from '../model'
import { TransactionResponse } from '../../currency_gateway'
import Decimal from 'decimal.js'
import util from 'util'
import { Logger } from '@abx-utils/logging'
import { MemoryCache } from '@abx-utils/db-connection-utils'
import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'
import { EndpointInvocationUtils } from '../providers/EndpointInvocationUtils'
import { CryptoApisProviderProxy, IConfirmedTransaction } from '../providers/crypto-apis'
import * as bitcoin from 'bitcoinjs-lib'
import { mainnetEnvironments } from './BitcoinBlockchainFacade'
import { Environment } from '@abx-types/reference-data'
import { BitcoinTransactionFeeEstimator } from './BitcoinTransactionFeeEstimator'
import { BitcoinTransactionCreationUtils } from './BitcoinTransactionCreationUtils'

export class BitcoinTransactionDispatcher {
  private readonly LOGGER = Logger.getInstance('blockchain-currency-gateway', 'BitcoinBlockchainFacade')

  private readonly bitcoinTransactionFeeEstimator: BitcoinTransactionFeeEstimator
  private readonly network = mainnetEnvironments.includes(process.env.NODE_ENV as Environment) ? bitcoin.networks.bitcoin : bitcoin.networks.testnet

  constructor(private cryptoApisProviderProxy: CryptoApisProviderProxy) {
    this.bitcoinTransactionFeeEstimator = new BitcoinTransactionFeeEstimator(cryptoApisProviderProxy, new MemoryCache())
  }

  /**
   * The transaction creation workflow contains 3 steps (3rd step is optional):
   * 1. Calculating fee based on the transaction size
   * 2. Create Transaction -> Sign -> Send on-chain
   * 3. Optionally register a transaction confirmation webhook
   */
  public async createTransaction({
    senderAddress,
    receiverAddress,
    amount,
    webhookCallbackUrl,
    webhookRegistrationFailureUrl,
    memo,
    feeLimit,
  }: CreateTransactionPayload): Promise<TransactionResponse> {
    let estimatedTransactionFee
    try {
      estimatedTransactionFee = await this.bitcoinTransactionFeeEstimator.estimateTransactionFee({
        senderAddress,
        receiverAddress,
        amount,
        memo,
        feeLimit,
      })
      this.LOGGER.info(`Estimated fee of ${estimatedTransactionFee} for transaction of ${amount} from ${senderAddress.address} to ${receiverAddress}`)
    } catch (e) {
      const errorMessage = `An error has ocurred while trying to calculate fee for transaction of ${amount} from ${senderAddress.address} to ${receiverAddress}`
      this.LOGGER.error(`${errorMessage} ${JSON.stringify(util.inspect(e))}`)

      throw new ApiProviderError(errorMessage)
    }

    let transactionHash
    try {
      transactionHash = await this.sendTransaction(senderAddress, receiverAddress, amount, estimatedTransactionFee, memo)
      this.LOGGER.info(`Successfully sent transaction with hash ${transactionHash} for ${amount} from ${senderAddress.address} to ${receiverAddress}`)
    } catch (e) {
      const errorMessage = `An error has ocurred while trying to send transaction for transaction of ${amount} from ${senderAddress.address} to ${receiverAddress}`
      this.LOGGER.error(`${errorMessage} ${JSON.stringify(util.inspect(e))}`)

      throw new ApiProviderError(errorMessage)
    }

    if (!!webhookCallbackUrl) {
      await this.createTransactionConfirmationWebhook(transactionHash, webhookCallbackUrl, webhookRegistrationFailureUrl!)
    }

    return {
      txHash: transactionHash,
      transactionFee: estimatedTransactionFee,
    }
  }

  private async sendTransaction(
    senderAddress: Pick<CryptoAddress, 'privateKey' | 'address' | 'wif'>,
    receiverAddress: string,
    amount: number,
    fee: number,
    memo: string | undefined,
  ): Promise<string> {
    let amountAfterFee = new Decimal(amount)
      .minus(fee)
      .toDP(BitcoinTransactionCreationUtils.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN)
      .toNumber()

    const { hex: transactionHex } = await this.cryptoApisProviderProxy.createTransaction({
      inputs: [BitcoinTransactionCreationUtils.createTransactionAddress(senderAddress.address!, amountAfterFee)],
      outputs: [BitcoinTransactionCreationUtils.createTransactionAddress(receiverAddress, amountAfterFee)],
      fee: {
        address: senderAddress.address!,
        value: fee,
      },
      data: memo,
    })

    const signedTransactionHex = this.signTransaction(transactionHex, senderAddress.wif!)

    const { txid } = await this.cryptoApisProviderProxy.broadcastTransaction(signedTransactionHex)
    return txid
  }

  /** In order to keep all wifs private we use offline/native signing (instead of submitting request to the API provider). */
  public signTransaction(transactionHex: string, senderWif: string): string {
    const transaction = bitcoin.Transaction.fromHex(transactionHex)

    const transactionBuilder = new bitcoin.TransactionBuilder(this.network)
    const senderKeyPair = bitcoin.ECPair.fromWIF(senderWif, this.network)

    transaction.outs.forEach(txOut => {
      transactionBuilder.addOutput(txOut.script, txOut.value)
    })

    transaction.ins.forEach(txIn => {
      transactionBuilder.addInput(txIn.hash, txIn.index)
    })

    transaction.ins.forEach((_, idx) => {
      transactionBuilder.sign(idx, senderKeyPair)
    })

    return transactionBuilder.build().toHex()
  }

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
  private async createTransactionConfirmationWebhook(transactionHash: string, webhookCallbackUrl: string, webhookRegistrationFailureUrl: string) {
    try {
      const { confirmations, created } = await EndpointInvocationUtils.invokeEndpointWithProgressiveRetry<IConfirmedTransaction>({
        name: 'createConfirmedTransactionWebHook',
        endpointInvoker: () =>
          this.cryptoApisProviderProxy.createConfirmedTransactionEventSubscription({
            callbackURL: webhookCallbackUrl,
            transactionHash,
            confirmations: Number(process.env.BITCOIN_TRANSACTION_CONFIRMATION_BLOCKS),
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
