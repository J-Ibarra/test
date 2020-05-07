import {
  CryptoAddress,
  MultiTargetCreateTransactionPayload,
  MultiTargetTransactionReceiver,
  MultiTargetTransactionCreationResult,
} from '../../../model'
import Decimal from 'decimal.js'
import util from 'util'
import { Logger } from '@abx-utils/logging'
import { MemoryCache } from '@abx-utils/db-connection-utils'
import { BtcCryptoApisProviderProxy } from '../../../api-provider/crypto-apis'
import { BitcoinTransactionCreationUtils } from '../../BitcoinTransactionCreationUtils'
import { signTransaction } from '../TransactionSigner'
import { BitcoinTransactionDispatcher } from '../BitcoinTransactionDispatcher'
import { MultiTargetTransactionFeeEstimator } from './MultiTargetTransactionFeeEstimator'

export class MultiTargetTransactionDispatcher implements BitcoinTransactionDispatcher {
  private readonly LOGGER = Logger.getInstance('blockchain-currency-gateway', 'BitcoinApiProviderFacade')

  private readonly bitcoinTransactionFeeEstimator: MultiTargetTransactionFeeEstimator

  constructor(private cryptoApisProviderProxy: BtcCryptoApisProviderProxy) {
    this.bitcoinTransactionFeeEstimator = new MultiTargetTransactionFeeEstimator(cryptoApisProviderProxy, new MemoryCache())
  }

  /**
   * The transaction creation workflow contains 3 steps (3rd step is optional):
   * 1. Calculating fee based on the transaction size
   * 2. Create Transaction -> Sign -> Send on-chain
   * 3. Optionally register a transaction confirmation webhook
   */
  public async createTransaction({
    senderAddress,
    receivers,
    memo,
    subtractFeeFromAmountSent = true,
    feeLimit,
    transactionFeeIncrement,
  }: MultiTargetCreateTransactionPayload): Promise<MultiTargetTransactionCreationResult> {
    let estimatedTransactionFee = 0
    const totalAmountToSend = new Decimal(receivers.reduce((acc, { amount }) => acc + amount, 0))
      .toDP(BitcoinTransactionCreationUtils.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN)
      .toNumber()

    try {
      estimatedTransactionFee = await this.bitcoinTransactionFeeEstimator.estimateTransactionFee({
        senderAddress,
        receivers,
        memo,
        feeLimit,
        transactionFeeIncrement,
      })
      this.LOGGER.info(
        `Estimated fee of ${estimatedTransactionFee} for transaction of ${totalAmountToSend} from ${senderAddress.address} to ${receivers
          .map(({ address }) => address)
          .join(',')}`,
      )
    } catch (e) {
      const errorMessage = `An error has ocurred while trying to calculate fee for transaction of ${totalAmountToSend} from ${
        senderAddress.address
      } to ${receivers.map(({ address }) => address).join(',')}`
      this.LOGGER.error(`${errorMessage} ${JSON.stringify(util.inspect(e))}`)

      throw e
    }

    try {
      const { txid, averageFeePaidByEachReceiver } = await this.sendTransaction(
        senderAddress,
        receivers,
        totalAmountToSend,
        estimatedTransactionFee,
        memo,
        subtractFeeFromAmountSent,
      )
      this.LOGGER.info(`Successfully sent transaction with hash ${txid} for ${totalAmountToSend} from ${senderAddress.address}`)

      return {
        txHash: txid,
        averageFeePerReceiver: averageFeePaidByEachReceiver,
        totalFee: estimatedTransactionFee,
      } as MultiTargetTransactionCreationResult
    } catch (e) {
      const errorMessage = `An error has ocurred while trying to send transaction for transaction of ${totalAmountToSend} from ${senderAddress.address}`
      this.LOGGER.error(`${errorMessage} ${JSON.stringify(util.inspect(e))}`)

      throw e
    }
  }

  private async sendTransaction(
    senderAddress: Pick<CryptoAddress, 'privateKey' | 'address' | 'wif'>,
    receivers: MultiTargetTransactionReceiver[],
    amount: number,
    fee: number,
    memo: string | undefined,
    subtractFeeFromAmountSent: boolean,
  ): Promise<{ txid: string; averageFeePaidByEachReceiver: number }> {
    const amountAfterFee = new Decimal(amount).minus(fee).toDP(BitcoinTransactionCreationUtils.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN).toNumber()
    const averageFeePaidByEachReceiver = new Decimal(fee)
      .dividedBy(receivers.length)
      .toDP(BitcoinTransactionCreationUtils.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN)
      .toNumber()

    const { hex: transactionHex } = await this.cryptoApisProviderProxy.createTransaction({
      inputs: [BitcoinTransactionCreationUtils.createTransactionAddress(senderAddress.address!, subtractFeeFromAmountSent ? amountAfterFee : amount)],
      outputs: receivers.map(({ address, amount: receiverAmount }) =>
        BitcoinTransactionCreationUtils.createTransactionAddress(
          address,
          subtractFeeFromAmountSent
            ? new Decimal(receiverAmount)
                .minus(averageFeePaidByEachReceiver)
                .toDP(BitcoinTransactionCreationUtils.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN)
                .toNumber()
            : receiverAmount,
        ),
      ),
      fee: {
        address: senderAddress.address!,
        value: fee,
      },
      data: memo,
    })

    const signedTransactionHex = signTransaction(transactionHex, senderAddress.wif!)

    const { txid } = await this.cryptoApisProviderProxy.broadcastTransaction(signedTransactionHex)
    return { txid, averageFeePaidByEachReceiver }
  }
}
