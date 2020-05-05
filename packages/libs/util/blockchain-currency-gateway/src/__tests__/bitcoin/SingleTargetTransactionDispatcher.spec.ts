import { SingleTargetTransactionDispatcher } from '../../bitcoin/transaction-dispatchers/single-target/SingleTargetTransactionDispatcher'
import sinon from 'sinon'
import { expect } from 'chai'
import Decimal from 'decimal.js'
import * as testUtils from './utils/SingleTargetTransactionDispatcher.utils'
import * as bitcoin from 'bitcoinjs-lib'
import { BitcoinTransactionCreationUtils } from '../../bitcoin/BitcoinTransactionCreationUtils'
import { cryptoApiClient } from './utils/SingleTargetTransactionDispatcher.utils'
import { BitcoinTransactionDispatcher } from '../../bitcoin/transaction-dispatchers/BitcoinTransactionDispatcher'
import { SingleTargetTransactionFeeEstimator } from '../../bitcoin/transaction-dispatchers/single-target/SingleTargetTransactionFeeEstimator'
import { TransactionResponse } from '../../currency_gateway'

describe('SingleTargetTransactionDispatcher', () => {
  let bitcoinTransactionDispatcher: BitcoinTransactionDispatcher
  const signedTransactionHex = 'signedTransactionHex'

  beforeEach(() => {
    process.env.BITCOIN_TRANSACTION_CONFIRMATION_BLOCKS = `${testUtils.bitcoinConfirmationBlocks}`
    bitcoinTransactionDispatcher = new SingleTargetTransactionDispatcher(cryptoApiClient)

    sinon.stub(bitcoin.TransactionBuilder.prototype, 'build').returns({
      toHex: () => signedTransactionHex,
    } as any)
    sinon.stub(bitcoin.Transaction, 'fromHex').returns({
      outs: [],
      ins: [],
    } as any)
    sinon.stub(bitcoin.ECPair, 'fromWIF').returns({} as any)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should create transaction', async () => {
    const payload = testUtils.singleTargetCreateTransactionPayload()
    const estimatedFee = 0.00002
    const estimateTransactionFeeStub = sinon.stub(SingleTargetTransactionFeeEstimator.prototype, 'estimateTransactionFee').resolves(estimatedFee)
    testUtils.createTransactionStub.resolves({ hex: testUtils.transactionHex })
    testUtils.signTransactionStub.resolves(testUtils.signedTransactionHex)
    testUtils.broadcastTransactionStub.resolves({ txid: testUtils.transactionId })


    const { txHash, transactionFee } = await bitcoinTransactionDispatcher.createTransaction(payload) as TransactionResponse

    const amountAfterFee = new Decimal(payload.amount)
      .minus(estimatedFee)
      .toDP(BitcoinTransactionCreationUtils.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN)
      .toNumber()

    expect(txHash).to.eql(testUtils.transactionId)
    expect(transactionFee).to.eql(estimatedFee)

    expect(
      estimateTransactionFeeStub.calledWith({
        senderAddress: payload.senderAddress,
        receiverAddress: payload.receiverAddress,
        amount: payload.amount,
        memo: payload.memo,
        feeLimit: payload.feeLimit,
      }),
    ).to.eql(true)

    expect(
      testUtils.createTransactionStub.calledWith({
        inputs: [
          {
            address: payload.senderAddress.address,
            value: amountAfterFee,
          },
        ],
        outputs: [
          {
            address: payload.receiverAddress,
            value: amountAfterFee,
          },
        ],
        fee: {
          address: payload.senderAddress.address,
          value: estimatedFee,
        },
        data: payload.memo,
      }),
    ).to.eql(true)
  })

  it('should create transaction without subtracted fee', async () => {
    const subtractFeeFromAmountSent = false

    const payload = testUtils.singleTargetCreateTransactionPayload(subtractFeeFromAmountSent)
    const estimatedFee = 0.00002
    sinon.stub(SingleTargetTransactionFeeEstimator.prototype, 'estimateTransactionFee').resolves(estimatedFee)
    testUtils.createTransactionStub.resolves({ hex: testUtils.transactionHex })
    testUtils.signTransactionStub.resolves(testUtils.signedTransactionHex)
    testUtils.broadcastTransactionStub.resolves({ txid: testUtils.transactionId })

    await bitcoinTransactionDispatcher.createTransaction(payload) as TransactionResponse

    expect(
      testUtils.createTransactionStub.calledWith({
        inputs: [
          {
            address: payload.senderAddress.address,
            value: payload.amount,
          },
        ],
        outputs: [
          {
            address: payload.receiverAddress,
            value: payload.amount,
          },
        ],
        fee: {
          address: payload.senderAddress.address,
          value: estimatedFee,
        },
        data: payload.memo,
      }),
    ).to.eql(true)
  })

  it('should fail and throw error when estimateTransactionFee call fails', async () => {
    testUtils.resetStubs()
    sinon.stub(SingleTargetTransactionFeeEstimator.prototype, 'estimateTransactionFee').throws('Foo')

    try {
      await bitcoinTransactionDispatcher.createTransaction(testUtils.singleTargetCreateTransactionPayload())
    } catch (e) {
      expect(testUtils.createTransactionStub.notCalled).to.eql(true)
    }
  })
})
