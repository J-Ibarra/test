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

export class BitcoinTransactionDispatcher {
  private readonly LOGGER = Logger.getInstance('blockchain-currency-gateway', 'BitcoinBlockchainFacade')
  private readonly AVERAGE_FEE_PER_BYTE = 'avg-fee-per-byte'
  private readonly AVERAGE_FEE_PER_TRANSACTION = 'avg-fee-per-transaction'
  private readonly CACHE_EXPIRY_IN_MILLIS = 1000 * 60 * 30
  private readonly MAX_BITCOIN_DECIMALS = 8
  private readonly network = mainnetEnvironments.includes(process.env.NODE_ENV as Environment) ? bitcoin.networks.bitcoin : bitcoin.networks.testnet

  constructor(private cryptoApisProviderProxy: CryptoApisProviderProxy, private MEMORY_CACHE = new MemoryCache()) {}

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
  }: CreateTransactionPayload): Promise<TransactionResponse> {
    let estimatedTransactionFee
    try {
      estimatedTransactionFee = await this.estimateTransactionFee(senderAddress, receiverAddress, amount)
      this.LOGGER.info(`Estimated fee of ${estimatedTransactionFee} for transaction of ${amount} from ${senderAddress.address} to ${receiverAddress}`)
    } catch (e) {
      const errorMessage = `An error has ocurred while trying to calculate fee for transaction of ${amount} from ${senderAddress.address} to ${receiverAddress}`
      this.LOGGER.error(`${errorMessage} ${JSON.stringify(util.inspect(e))}`)

      throw new ApiProviderError(errorMessage)
    }

    let transactionHash
    try {
      transactionHash = await this.sendTransaction(senderAddress, receiverAddress, amount, estimatedTransactionFee)
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

  /**
   * In order to estimate transaction fee we follow the 3-step workflow:
   * 1.Get analytics on the transaction fees payed for other transactions({@code getTransactionsFee}) in order to get average_fee_per_byte and average.
   * We don’t need to be 100% accurate with the fee, so we can cache the values for 30 minutes in memory and use the cached value on subsequent calls.
   * 2. Use {@code getTransactionSize} to calculate the transaction size.When invoking the endpoint, we would need to pass 1 input and 1 output addresses
   * and a fee. The fee should be taken from the input address and for the fee value we can use the average from 1. It is important that the number of digits
   * used here equals the number of digits of the fee used when creating the transaction.
   * 3.Use the block size response from 2. and the average_fee_per_byte from 1. to calculate the actual fee for the current transaction
   */
  private async estimateTransactionFee(
    senderAddress: Pick<CryptoAddress, 'privateKey' | 'address' | 'wif'>,
    receiverAddress: string,
    amount: number,
  ): Promise<number> {
    let averageFeePerByte = this.MEMORY_CACHE.get<string>(this.AVERAGE_FEE_PER_BYTE)
    let averageFeePerTransaction = this.MEMORY_CACHE.get<string>(this.AVERAGE_FEE_PER_TRANSACTION)

    if (!averageFeePerByte) {
      const {
        average: latestAverageFeePerTransaction,
        average_fee_per_byte: latestAverageFeePerByte,
      } = await this.cryptoApisProviderProxy.getTransactionsFee()
      this.MEMORY_CACHE.set({ key: this.AVERAGE_FEE_PER_BYTE, ttl: this.CACHE_EXPIRY_IN_MILLIS, val: latestAverageFeePerByte })
      this.MEMORY_CACHE.set({ key: this.AVERAGE_FEE_PER_TRANSACTION, ttl: this.CACHE_EXPIRY_IN_MILLIS, val: latestAverageFeePerTransaction })

      averageFeePerByte = latestAverageFeePerByte
      averageFeePerTransaction = latestAverageFeePerTransaction
    }

    const { tx_size_bytes } = await this.cryptoApisProviderProxy.getTransactionSize({
      inputs: this.createTransactionAddressArray(senderAddress.address, amount),
      outputs: this.createTransactionAddressArray(receiverAddress, amount),
      fee: {
        address: senderAddress.address,
        value: new Decimal(averageFeePerTransaction!).toDP(this.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN).toNumber(),
      },
    })

    return new Decimal(tx_size_bytes)
      .times(averageFeePerByte!)
      .toDP(this.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN)
      .toNumber()
  }

  private async sendTransaction(
    senderAddress: Pick<CryptoAddress, 'privateKey' | 'address' | 'wif'>,
    receiverAddress: string,
    amount: number,
    fee: number,
  ): Promise<string> {
    const { hex: transactionHex } = await this.cryptoApisProviderProxy.createTransaction({
      inputs: this.createTransactionAddressArray(senderAddress.address, amount),
      outputs: this.createTransactionAddressArray(receiverAddress, amount),
      fee: {
        address: senderAddress.address,
        value: fee,
      },
    })

    const signedTransactionHex = this.signTransaction(transactionHex, senderAddress.wif)

    const { txid } = await this.cryptoApisProviderProxy.broadcastTransaction(signedTransactionHex)
    return txid
  }

  /** In order to keep all wifs private we use offline/native signing (instead of submitting request to the API provider). */
  private signTransaction(transactionHex: string, senderWif: string): string {
    const transaction = bitcoin.Transaction.fromHex(transactionHex)

    const transactionBuilder = new bitcoin.TransactionBuilder(this.network)
    const keyPair = bitcoin.ECPair.fromWIF(senderWif, this.network)

    transaction.outs.forEach(txOut => {
      transactionBuilder.addOutput(txOut.script, txOut.value)
    })

    transaction.ins.forEach((txIn, idx) => {
      transactionBuilder.addInput(txIn.hash, txIn.index)
      transactionBuilder.sign(idx, keyPair)
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
            confirmations: Number(process.env.BITCOIN_CONFIRMATION_BLOCKS),
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

  private createTransactionAddressArray(address: string, amount: number) {
    return [
      {
        address,
        value: amount,
      },
    ]
  }
}
