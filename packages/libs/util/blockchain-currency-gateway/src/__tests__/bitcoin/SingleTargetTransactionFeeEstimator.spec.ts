import { expect } from 'chai'
import sinon from 'sinon'
import { MemoryCache } from '@abx-utils/db-connection-utils'
import { SingleTargetTransactionFeeEstimator } from '../../bitcoin/transaction-dispatchers/single-target/SingleTargetTransactionFeeEstimator'
import * as testData from './test_data'
import { BitcoinTransactionCreationUtils } from '../../bitcoin/BitcoinTransactionCreationUtils'
import Decimal from 'decimal.js'

describe('BitcoinTransactionFeeEstimator:estimateTransactionFee', () => {
  let bitcoinTransactionFeeEstimator
  let cryptoApisProviderProxyStub
  let memoryCache

  beforeEach(() => {
    cryptoApisProviderProxyStub = {
      getTransactionSize: sinon.stub(),
      getTransactionsFee: sinon.stub(),
    } as any
    memoryCache = new MemoryCache()
    bitcoinTransactionFeeEstimator = new SingleTargetTransactionFeeEstimator(cryptoApisProviderProxyStub, memoryCache)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should use cached values when present', async () => {
    memoryCache.set({
      key: bitcoinTransactionFeeEstimator.AVERAGE_FEE_PER_BYTE_KEY,
      ttl: 10_000,
      val: `${testData.averageFeePerByte}`,
    })
    memoryCache.set({
      key: bitcoinTransactionFeeEstimator.AVERAGE_FEE_PER_TRANSACTION_KEY,
      ttl: 10_000,
      val: `${testData.averageFeePerTransaction}`,
    })

    const getTransactionSizeStub = cryptoApisProviderProxyStub.getTransactionSize.resolves({ tx_size_bytes: testData.transactionSizeBytes })

    const estimatedFee = await bitcoinTransactionFeeEstimator.estimateTransactionFee({
      senderAddress: testData.senderAddress,
      receiverAddress: testData.receiverAddress,
      amount: testData.txAmount,
      memo: testData.memo,
    })

    expect(cryptoApisProviderProxyStub.getTransactionsFee.calledOnce).to.eql(false)
    expect(
      getTransactionSizeStub.calledWith({
        inputs: [BitcoinTransactionCreationUtils.createTransactionAddress(testData.senderAddress.address!, testData.txAmount)],
        outputs: [BitcoinTransactionCreationUtils.createTransactionAddress(testData.receiverAddress, testData.txAmount)],
        fee: {
          address: testData.senderAddress.address!,
          value: new Decimal(testData.averageFeePerTransaction!)
            .toDP(BitcoinTransactionCreationUtils.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN)
            .toNumber(),
        },
        data: testData.memo,
      }),
    ).to.eql(true)
    expect(estimatedFee).to.eql(testData.averageFeePerByte * testData.transactionSizeBytes)
  })

  it('should fetch transaction fee details when cache empty or expired', async () => {
    const getTransactionsFeeStub = cryptoApisProviderProxyStub.getTransactionsFee.resolves({
      average: testData.averageFeePerTransaction,
      average_fee_per_byte: testData.averageFeePerByte,
    })

    const getTransactionSizeStub = cryptoApisProviderProxyStub.getTransactionSize.resolves({ tx_size_bytes: testData.transactionSizeBytes })

    const estimatedFee = await bitcoinTransactionFeeEstimator.estimateTransactionFee({
      senderAddress: testData.senderAddress,
      receiverAddress: testData.receiverAddress,
      amount: testData.txAmount,
      memo: testData.memo,
    })

    expect(getTransactionsFeeStub.calledOnce).to.eql(true)
    expect(
      getTransactionSizeStub.calledWith({
        inputs: [BitcoinTransactionCreationUtils.createTransactionAddress(testData.senderAddress.address!, testData.txAmount)],
        outputs: [BitcoinTransactionCreationUtils.createTransactionAddress(testData.receiverAddress, testData.txAmount)],
        fee: {
          address: testData.senderAddress.address!,
          value: new Decimal(testData.averageFeePerTransaction!)
            .toDP(BitcoinTransactionCreationUtils.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN)
            .toNumber(),
        },
        data: testData.memo,
      }),
    ).to.eql(true)
    expect(estimatedFee).to.eql(testData.averageFeePerByte * testData.transactionSizeBytes)
  })

  it('should use fee limit when calculated transaction fee >= feeLimit', async () => {
    const getTransactionsFeeStub = cryptoApisProviderProxyStub.getTransactionsFee.resolves({
      average: testData.averageFeePerTransaction,
      average_fee_per_byte: 12,
    })

    const getTransactionSizeStub = cryptoApisProviderProxyStub.getTransactionSize.resolves({ tx_size_bytes: testData.transactionSizeBytes })
    const feeLimit = 0.5

    const estimatedFee = await bitcoinTransactionFeeEstimator.estimateTransactionFee({
      senderAddress: testData.senderAddress,
      receiverAddress: testData.receiverAddress,
      amount: testData.txAmount,
      memo: testData.memo,
      feeLimit,
    })

    expect(getTransactionsFeeStub.calledOnce).to.eql(true)
    expect(
      getTransactionSizeStub.calledWith({
        inputs: [BitcoinTransactionCreationUtils.createTransactionAddress(testData.senderAddress.address!, testData.txAmount)],
        outputs: [BitcoinTransactionCreationUtils.createTransactionAddress(testData.receiverAddress, testData.txAmount)],
        fee: {
          address: testData.senderAddress.address!,
          value: new Decimal(testData.averageFeePerTransaction!)
            .toDP(BitcoinTransactionCreationUtils.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN)
            .toNumber(),
        },
        data: testData.memo,
      }),
    ).to.eql(true)
    expect(estimatedFee).to.eql(feeLimit)
  })
})
