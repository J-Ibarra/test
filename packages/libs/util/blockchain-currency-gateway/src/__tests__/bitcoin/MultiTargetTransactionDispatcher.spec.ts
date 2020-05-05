import { MultiTargetTransactionDispatcher } from '../../bitcoin/transaction-dispatchers/multi-target/MultiTargetTransactionDispatcher'
import sinon from 'sinon'
import { expect } from 'chai'
import Decimal from 'decimal.js'
import * as testUtils from './utils/MultiTargetTransactionDispatcher.utils'
import * as bitcoin from 'bitcoinjs-lib'
import { BitcoinTransactionCreationUtils } from '../../bitcoin/BitcoinTransactionCreationUtils'
import { cryptoApiClient } from './utils/MultiTargetTransactionDispatcher.utils'
import { BitcoinTransactionDispatcher } from '../../bitcoin/transaction-dispatchers/BitcoinTransactionDispatcher'
import { MultiTargetTransactionFeeEstimator } from '../../bitcoin/transaction-dispatchers/multi-target/MultiTargetTransactionFeeEstimator'
import { MultiTargetTransactionCreationResult } from '../../model'

describe('MultiTargetTransactionDispatcher', () => {
  let bitcoinTransactionDispatcher: BitcoinTransactionDispatcher
  const signedTransactionHex = 'signedTransactionHex'
  const estimatedFee = 0.00009
  const payload = testUtils.multiTargetCreateTransactionPayload()

  const totalAmountToSend = new Decimal(payload.receivers.reduce((acc, { amount }) => acc + amount, 0))
  .toDP(BitcoinTransactionCreationUtils.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN)
  .toNumber()

  beforeEach(() => {
    process.env.BITCOIN_TRANSACTION_CONFIRMATION_BLOCKS = `${testUtils.bitcoinConfirmationBlocks}`
    bitcoinTransactionDispatcher = new MultiTargetTransactionDispatcher(cryptoApiClient)

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
    const estimateTransactionFeeStub = sinon.stub(MultiTargetTransactionFeeEstimator.prototype, 'estimateTransactionFee').resolves(estimatedFee)
    testUtils.createTransactionStub.resolves({ hex: testUtils.transactionHex })
    testUtils.signTransactionStub.resolves(testUtils.signedTransactionHex)
    testUtils.broadcastTransactionStub.resolves({ txid: testUtils.transactionId })


    const { txHash, averageFeePerReceiver, totalFee } = await bitcoinTransactionDispatcher.createTransaction(payload) as MultiTargetTransactionCreationResult

    const amountAfterFee = new Decimal(totalAmountToSend).minus(estimatedFee).toDP(BitcoinTransactionCreationUtils.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN).toNumber()

    const averageFeePaidByEachReceiver = new Decimal(estimatedFee)
      .dividedBy(payload.receivers.length)
      .toDP(BitcoinTransactionCreationUtils.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN)
      .toNumber()

    expect(txHash).to.eql(testUtils.transactionId)
    expect(averageFeePerReceiver).to.eql(averageFeePaidByEachReceiver)
    expect(totalFee).to.eql(estimatedFee)


    expect(
      estimateTransactionFeeStub.calledWith({
        senderAddress: payload.senderAddress,
        memo: payload.memo,
        receivers: payload.receivers
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
        outputs: payload.receivers.map(receiver => 
          {
            return { 
              address: receiver.address, 
              value: new Decimal(receiver.amount)
              .minus(averageFeePaidByEachReceiver)
              .toDP(BitcoinTransactionCreationUtils.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN)
              .toNumber()
            }
          }
        ),
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

    const payloadWithoutSubtractedFee = testUtils.multiTargetCreateTransactionPayload(subtractFeeFromAmountSent)
    sinon.stub(MultiTargetTransactionFeeEstimator.prototype, 'estimateTransactionFee').resolves(estimatedFee)
    testUtils.createTransactionStub.resolves({ hex: testUtils.transactionHex })
    testUtils.signTransactionStub.resolves(testUtils.signedTransactionHex)
    testUtils.broadcastTransactionStub.resolves({ txid: testUtils.transactionId })

    await bitcoinTransactionDispatcher.createTransaction(payloadWithoutSubtractedFee) as MultiTargetTransactionCreationResult

    expect(
      testUtils.createTransactionStub.calledWith({
        inputs: [
          {
            address: payloadWithoutSubtractedFee.senderAddress.address,
            value: totalAmountToSend,
          },
        ],
        outputs: payload.receivers.map(receiver => 
          {
            return { 
              address: receiver.address, 
              value: new Decimal(receiver.amount)
              .toDP(BitcoinTransactionCreationUtils.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN)
              .toNumber()
            }
          }
        ),
        fee: {
          address: payloadWithoutSubtractedFee.senderAddress.address,
          value: estimatedFee,
        },
        data: payloadWithoutSubtractedFee.memo,
      }),
    ).to.eql(true)
  })

  it('should fail and throw error when estimateTransactionFee call fails', async () => {
    testUtils.resetStubs()
    sinon.stub(MultiTargetTransactionFeeEstimator.prototype, 'estimateTransactionFee').throws('Foo')

    try {
      await bitcoinTransactionDispatcher.createTransaction(testUtils.multiTargetCreateTransactionPayload())
    } catch (e) {
      expect(testUtils.createTransactionStub.notCalled).to.eql(true)
    }
  })
})
