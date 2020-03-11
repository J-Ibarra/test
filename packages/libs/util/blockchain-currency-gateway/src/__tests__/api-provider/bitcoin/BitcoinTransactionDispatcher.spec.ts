import { BitcoinTransactionDispatcher } from '../../../api-provider/bitcoin/BitcoinTransactionDispatcher'
import sinon from 'sinon'
import { expect } from 'chai'
import Decimal from 'decimal.js'
import { EndpointInvocationUtils } from '../../../api-provider/providers/EndpointInvocationUtils'
import * as testUtils from './BitcoinTransactionDispatcher.utils'
import * as asyncMessagePublisher from '@abx-utils/async-message-publisher'
import * as bitcoin from 'bitcoinjs-lib'
import { BitcoinTransactionFeeEstimator } from '../../../api-provider/bitcoin/BitcoinTransactionFeeEstimator'
import { BitcoinTransactionCreationUtil } from '../../../api-provider/bitcoin/BitcoinTransactionCreationUtil'
import { cryptoApiClient } from './BitcoinTransactionDispatcher.utils'

describe('BitcoinTransactionDispatcher', () => {
  let bitcoinTransactionDispatcher: BitcoinTransactionDispatcher
  let invokeEndpointWithProgressiveRetryStub
  const signedTransactionHex = 'signedTransactionHex'

  beforeEach(() => {
    process.env.BITCOIN_TRANSACTION_CONFIRMATION_BLOCKS = `${testUtils.bitcoinConfirmationBlocks}`
    bitcoinTransactionDispatcher = new BitcoinTransactionDispatcher(cryptoApiClient)
    invokeEndpointWithProgressiveRetryStub = sinon.stub(EndpointInvocationUtils, 'invokeEndpointWithProgressiveRetry')

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
    testUtils.resetStubs()
  })

  it('should create transaction and subscribe after calculating fee', async () => {
    const estimatedFee = 0.00002
    const estimateTransactionFeeStub = sinon.stub(BitcoinTransactionFeeEstimator.prototype, 'estimateTransactionFee').resolves(estimatedFee)
    testUtils.createTransactionStub.resolves({ hex: testUtils.transactionHex })
    testUtils.broadcastTransactionStub.resolves({ txid: testUtils.transactionId })

    testUtils.createConfirmedTransactionEventSubscriptionStub.resolves()
    invokeEndpointWithProgressiveRetryStub.callsFake(async ({ endpointInvoker }) => {
      await endpointInvoker()

      return {
        payload: { confirmations: 0, created: new Date().toISOString() },
      }
    })

    const { txHash, transactionFee } = await bitcoinTransactionDispatcher.createTransaction(testUtils.createTransactionPayload)

    const amountAfterFee = new Decimal(testUtils.createTransactionPayload.amount)
      .minus(estimatedFee)
      .toDP(BitcoinTransactionCreationUtil.MAX_BITCOIN_DECIMALS, Decimal.ROUND_DOWN)
      .toNumber()

    expect(txHash).to.eql(testUtils.transactionId)
    expect(transactionFee).to.eql(estimatedFee)

    expect(testUtils.broadcastTransactionStub.calledWith(signedTransactionHex)).to.eql(true)
    expect(
      estimateTransactionFeeStub.calledWith({
        senderAddress: testUtils.createTransactionPayload.senderAddress,
        receiverAddress: testUtils.createTransactionPayload.receiverAddress,
        amount: testUtils.createTransactionPayload.amount,
        memo: testUtils.createTransactionPayload.memo,
        feeLimit: testUtils.createTransactionPayload.feeLimit,
      }),
    ).to.eql(true)
    expect(
      testUtils.createTransactionStub.calledWith({
        inputs: [
          {
            address: testUtils.createTransactionPayload.senderAddress.address,
            value: amountAfterFee,
          },
        ],
        outputs: [
          {
            address: testUtils.createTransactionPayload.receiverAddress,
            value: amountAfterFee,
          },
        ],
        fee: {
          address: testUtils.createTransactionPayload.senderAddress.address,
          value: estimatedFee,
        },
        data: testUtils.createTransactionPayload.memo,
      }),
    ).to.eql(true)

    expect(invokeEndpointWithProgressiveRetryStub.calledOnce).to.eql(true)
    expect(
      testUtils.createConfirmedTransactionEventSubscriptionStub.calledWith({
        callbackURL: testUtils.createTransactionPayload.webhookCallbackUrl,
        transactionHash: txHash,
        confirmations: testUtils.bitcoinConfirmationBlocks,
      }),
    ).to.eql(true)
  })

  it('should fail and throw error when estimateTransactionFee call fails', async () => {
    sinon.stub(BitcoinTransactionFeeEstimator.prototype, 'estimateTransactionFee').throws('Foo')

    try {
      await bitcoinTransactionDispatcher.createTransaction(testUtils.createTransactionPayload)
    } catch (e) {
      expect(e.name).to.eql('ApiProviderError')
      expect(testUtils.createTransactionStub.notCalled).to.eql(true)
      expect(invokeEndpointWithProgressiveRetryStub.notCalled).to.eql(true)
    }
  })

  it('should fail and throw error when createTransaction call fails', async () => {
    testUtils.createTransactionStub.throws('Foo')

    try {
      testUtils.getTransactionsFeeStub.resolves({
        average: testUtils.average,
        average_fee_per_byte: testUtils.average_fee_per_byte,
      })
      testUtils.getTransactionSizeStub.resolves({ tx_size_bytes: testUtils.tx_size_bytes })
      testUtils.createTransactionStub.resolves({ txid: testUtils.transactionId })

      await bitcoinTransactionDispatcher.createTransaction(testUtils.createTransactionPayload)
    } catch (e) {
      expect(e.name).to.eql('ApiProviderError')
      expect(invokeEndpointWithProgressiveRetryStub.notCalled).to.eql(true)
    }
  })

  it('should invoke sendAsyncChangeMessage when createAddressTransactionConfirmationEventSubscription call fails', async () => {
    testUtils.createConfirmedTransactionEventSubscriptionStub.throws('Foo')
    const sendAsyncChangeMessageStub = sinon.stub(asyncMessagePublisher, 'sendAsyncChangeMessage').resolves()
    testUtils.getTransactionsFeeStub.resolves({
      average: testUtils.average,
      average_fee_per_byte: testUtils.average_fee_per_byte,
    })
    sinon.stub(BitcoinTransactionFeeEstimator.prototype, 'estimateTransactionFee').resolves(1)
    testUtils.createConfirmedTransactionEventSubscriptionStub.resolves()

    invokeEndpointWithProgressiveRetryStub.throws('Foo')

    await bitcoinTransactionDispatcher.createTransaction(testUtils.createTransactionPayload)

    expect(
      sendAsyncChangeMessageStub.calledWith({
        type: 'createTransactionConfirmationWebhook-failure',
        target: {
          local: 'createTransactionConfirmationWebhook-failure-local',
          deployedEnvironment: testUtils.createTransactionPayload.webhookRegistrationFailureUrl,
        },
        payload: {
          transactionHash: testUtils.transactionId,
        },
      }),
    ).to.eql(true)
  })
})
