import { BitcoinTransactionDispatcher } from '../../../api-provider/bitcoin/BitcoinTransactionDispatcher'
import sinon from 'sinon'
import { expect } from 'chai'
import Decimal from 'decimal.js'
import { EndpointInvocationUtils } from '../../../api-provider/providers/EndpointInvocationUtils'
import * as testUtils from './BitcoinTransactionDispatcher.utils'
import * as asyncMessagePublisher from '@abx-utils/async-message-publisher'
// import * as bitcoin from 'bitcoinjs-lib'
import { CryptoApisProviderProxy, ENetworkTypes } from '../../../api-provider'
import { CurrencyCode } from '@abx-types/reference-data'

describe.only('BitcoinTransactionDispatcher', () => {
  let bitcoinTransactionDispatcher: BitcoinTransactionDispatcher
  let invokeEndpointWithProgressiveRetryStub
  const signedTransactionHex = 'signedTransactionHex'

  beforeEach(() => {
    process.env.BITCOIN_TRANSACTION_CONFIRMATION_BLOCKS = `${testUtils.bitcoinConfirmationBlocks}`
    bitcoinTransactionDispatcher = new BitcoinTransactionDispatcher(
      new CryptoApisProviderProxy(CurrencyCode.bitcoin, ENetworkTypes.TESTNET, '801c9ee2538cb40da9dbc03790894ea3431fb8ac'),
    )
    invokeEndpointWithProgressiveRetryStub = sinon.stub(EndpointInvocationUtils, 'invokeEndpointWithProgressiveRetry')

    // sinon.stub(bitcoin.TransactionBuilder.prototype, 'build').returns({
    //   toHex: () => signedTransactionHex,
    // } as any)
    // sinon.stub(bitcoin.Transaction, 'fromHex').returns({
    //   outs: [],
    //   ins: [],
    // } as any)
    // sinon.stub(bitcoin.ECPair, 'fromWIF').returns({} as any)
  })

  afterEach(() => {
    sinon.restore()
    testUtils.resetStubs()
  })

  it('should create transaction and subscribe after calculating fee', async () => {
    testUtils.getTransactionsFeeStub.resolves({
      average: testUtils.average,
      average_fee_per_byte: testUtils.average_fee_per_byte,
    })

    testUtils.getTransactionSizeStub.resolves({ tx_size_bytes: testUtils.tx_size_bytes })
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
    const expectedFee = new Decimal(testUtils.tx_size_bytes)
      .times(testUtils.average_fee_per_byte)
      .toDP(8, Decimal.ROUND_DOWN)
      .toNumber()

    expect(txHash).to.eql(testUtils.transactionId)
    expect(transactionFee).to.eql(expectedFee)

    expect(testUtils.getTransactionsFeeStub.calledOnce).to.eql(true)
    expect(testUtils.broadcastTransactionStub.calledWith(signedTransactionHex)).to.eql(true)
    expect(
      testUtils.getTransactionSizeStub.calledWith({
        inputs: [
          {
            address: testUtils.createTransactionPayload.senderAddress.address,
            value: testUtils.withdrawalAmount,
          },
        ],
        outputs: [
          {
            address: testUtils.createTransactionPayload.receiverAddress,
            value: testUtils.withdrawalAmount,
          },
        ],
        fee: {
          address: testUtils.createTransactionPayload.senderAddress.address,
          value: new Decimal(testUtils.average!).toDP(8, Decimal.ROUND_DOWN).toNumber(),
        },
      }),
    ).to.eql(true)
    expect(
      testUtils.createTransactionStub.calledWith({
        inputs: [
          {
            address: testUtils.createTransactionPayload.senderAddress.address,
            value: testUtils.withdrawalAmount,
          },
        ],
        outputs: [
          {
            address: testUtils.createTransactionPayload.receiverAddress,
            value: testUtils.withdrawalAmount,
          },
        ],
        fee: {
          address: testUtils.createTransactionPayload.senderAddress.address,
          value: expectedFee,
        },
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

  it('should fail and throw error when getTransactionsFee call fails', async () => {
    testUtils.getTransactionSizeStub.throws('Foo')

    try {
      await bitcoinTransactionDispatcher.createTransaction(testUtils.createTransactionPayload)
    } catch (e) {
      expect(e.name).to.eql('ApiProviderError')
      expect(testUtils.createTransactionStub.notCalled).to.eql(true)
      expect(invokeEndpointWithProgressiveRetryStub.notCalled).to.eql(true)
    }
  })

  it('should fail and throw error when getTransactionSizeStub call fails', async () => {
    testUtils.getTransactionSizeStub.throws('Foo')

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
    testUtils.getTransactionSizeStub.resolves({ tx_size_bytes: testUtils.tx_size_bytes })
    testUtils.createTransactionStub.resolves({ txid: testUtils.transactionId })
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

  it.only('foo bar', async () => {
    const result = await bitcoinTransactionDispatcher.signTransaction(
      '0200000003fedf54e412a959cb9965625b6bea650d542f3fab09c63aa281b4344cee8512740000000000ffffffffdbd2eceb6e27cc17c036527deba21ba17925aa75c57d485e368ac16596a55a770000000000ffffffff03b22f5186e51e6ea949706da5b46c9a761d93acf0526964eb31be72380132920000000000ffffffff025a000000000000001976a914a236af4ac2e37678ea6a3e3f58f33dceef379a7388ac64000000000000001976a914ed2978d100f77e66b99aea6f4c393b4dc253327c88ac00000000',
      'cSTwnCDo4UPrwVtdoEiZVg8R4vWiGkkWJ1RpQLPZyTk4YRSg4z7n',
    )

    console.log(result)
  })
})
