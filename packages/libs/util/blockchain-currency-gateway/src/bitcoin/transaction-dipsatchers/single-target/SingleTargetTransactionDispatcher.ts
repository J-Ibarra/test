import { CryptoAddress, ApiProviderError, SingleTargetCreateTransactionPayload } from '../../../model'
import { TransactionResponse } from '../../../currency_gateway'
import Decimal from 'decimal.js'
import util from 'util'
import { Logger } from '@abx-utils/logging'
import { MemoryCache } from '@abx-utils/db-connection-utils'
import { BtcCryptoApisProviderProxy } from '../../../api-provider/crypto-apis'
import { SingleTargetTransactionFeeEstimator } from './SingleTargetTransactionFeeEstimator'
import { BitcoinTransactionCreationUtils } from '../../BitcoinTransactionCreationUtils'
import { signTransaction } from '../TransactionSigner'
import { BitcoinTransactionDispatcher } from '../BitcoinTransactionDispatcher'

export class SingleTargetTransactionDispatcher implements BitcoinTransactionDispatcher {
  private readonly LOGGER = Logger.getInstance('blockchain-currency-gateway', 'BitcoinApiProviderFacade')

  private readonly bitcoinTransactionFeeEstimator: SingleTargetTransactionFeeEstimator

  constructor(private cryptoApisProviderProxy: BtcCryptoApisProviderProxy) {
    this.bitcoinTransactionFeeEstimator = new SingleTargetTransactionFeeEstimator(cryptoApisProviderProxy, new MemoryCache())
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
    memo,
    feeLimit,
  }: SingleTargetCreateTransactionPayload): Promise<TransactionResponse> {
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
    let amountAfterFee = new Decimal(amount).minus(fee).toDP(BitcoinTransactionCreationUtils.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN).toNumber()

    const { hex: transactionHex } = await this.cryptoApisProviderProxy.createTransaction({
      inputs: [BitcoinTransactionCreationUtils.createTransactionAddress(senderAddress.address!, amountAfterFee)],
      outputs: [BitcoinTransactionCreationUtils.createTransactionAddress(receiverAddress, amountAfterFee)],
      fee: {
        address: senderAddress.address!,
        value: fee,
      },
      data: memo,
    })

    const signedTransactionHex = signTransaction(transactionHex, senderAddress.wif!)

    const { txid } = await this.cryptoApisProviderProxy.broadcastTransaction(signedTransactionHex)
    return txid
  }
}
