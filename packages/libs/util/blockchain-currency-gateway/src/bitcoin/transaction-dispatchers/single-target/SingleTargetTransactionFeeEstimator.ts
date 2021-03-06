import { MemoryCache } from '@abx-utils/db-connection-utils'
import { BitcoinTransactionCreationUtils } from '../../BitcoinTransactionCreationUtils'
import Decimal from 'decimal.js'
import { BtcCryptoApisProviderProxy } from '../../../api-provider/crypto-apis/BtcCryptoApisProviderProxy'
import { SingleTargetCreateTransactionPayload } from '../../../model'

export class SingleTargetTransactionFeeEstimator {
  public static MAXIMUM_TX_FEE = 0.0003 // As per the business requirements required by operations
  /**
   * A static increment to add to the average bee per byte in order to
   * increase the priority of the transaction when mined.
   */
  public static FEE_INCREMENT_CONSTANT = 0.0000005

  readonly AVERAGE_FEE_PER_BYTE_KEY = 'avg-fee-per-byte'
  readonly AVERAGE_FEE_PER_TRANSACTION_KEY = 'avg-fee-per-transaction'
  readonly MINIMUM_TRANSACTION_FEE_KEY = 'minimum-transaction-fee'

  private readonly CACHE_EXPIRY_IN_MILLIS = 1000 * 60 * 30

  constructor(private cryptoApisProviderProxy: BtcCryptoApisProviderProxy, private MEMORY_CACHE = new MemoryCache()) {}

  /**
   * In order to estimate transaction fee we follow the 3-step workflow:
   *
   * 1.Get analytics on the transaction fees payed for other transactions({@code getTransactionsFee}) in order to get average_fee_per_byte.
   * We don’t need to be 100% accurate with the fee and don't expect big deviations,
   * so we can cache the values for 30 minutes in memory and use the cached value on subsequent calls.
   * 2. Use {@code getTransactionSize} to calculate the transaction size.When invoking the endpoint, we would need to the txin from the {@code transactionWithRelayFee}
   * and a fee. The fee should be taken from the input address and for the fee value we can use the average from 1. It is important that the number of digits
   * used here equals the number of digits of the fee used when creating the transaction (for the transaction size to remain the same).
   * 3*.Use the block size response from 2. and the average_fee_per_byte from 1. to calculate the actual fee for the current transaction
   * * - If the result from 3 is bigger than the amount to transfer the minimum transaction fee (taken from 1.) is used
   * For withdrawal transactions we want to make sure the calculated fee is always below the {@code feeLimit} to make sure the transaction
   * remains profitable for
   */
  public async estimateTransactionFee({
    senderAddress,
    receiverAddress,
    amount,
    memo,
    feeLimit = SingleTargetTransactionFeeEstimator.MAXIMUM_TX_FEE,
    transactionFeeIncrement = SingleTargetTransactionFeeEstimator.FEE_INCREMENT_CONSTANT,
  }: SingleTargetCreateTransactionPayload): Promise<number> {
    let averageFeePerByte = this.MEMORY_CACHE.get<string>(this.AVERAGE_FEE_PER_BYTE_KEY)
    let averageFeePerTransaction = this.MEMORY_CACHE.get<string>(this.AVERAGE_FEE_PER_TRANSACTION_KEY)

    if (!averageFeePerByte) {
      const {
        average: latestAverageFeePerTransaction,
        average_fee_per_byte: latestMinimumFeePerByte,
      } = await this.cryptoApisProviderProxy.getTransactionsFee()
      this.MEMORY_CACHE.set({ key: this.AVERAGE_FEE_PER_BYTE_KEY, ttl: this.CACHE_EXPIRY_IN_MILLIS, val: latestMinimumFeePerByte })
      this.MEMORY_CACHE.set({ key: this.AVERAGE_FEE_PER_TRANSACTION_KEY, ttl: this.CACHE_EXPIRY_IN_MILLIS, val: latestAverageFeePerTransaction })

      averageFeePerByte = latestMinimumFeePerByte
      averageFeePerTransaction = latestAverageFeePerTransaction
    }

    const bitcoinFeeRequest = this.createBitcoinFeeRequest(senderAddress.address!, receiverAddress, amount, averageFeePerTransaction!)

    const { tx_size_bytes } = await this.cryptoApisProviderProxy.getTransactionSize(
      memo
        ? {
            ...bitcoinFeeRequest,
            data: memo,
          }
        : bitcoinFeeRequest,
    )

    let estimatedMinimumTransactionFee = new Decimal(tx_size_bytes)
      .times(new Decimal(averageFeePerByte!).plus(transactionFeeIncrement))
      .toDP(BitcoinTransactionCreationUtils.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN)
      .toNumber()

    return Math.min(estimatedMinimumTransactionFee, feeLimit)
  }

  private createBitcoinFeeRequest(senderAddress: string, receiverAddress: string, amount: number, averageFeePerTransaction: string) {
    return {
      inputs: [BitcoinTransactionCreationUtils.createTransactionAddress(senderAddress!, amount)],
      outputs: [BitcoinTransactionCreationUtils.createTransactionAddress(receiverAddress, amount)],
      fee: {
        address: senderAddress!,
        value: new Decimal(averageFeePerTransaction!).toDP(BitcoinTransactionCreationUtils.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN).toNumber(),
      },
    }
  }
}
