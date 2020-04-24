import sinon from 'sinon'
import { expect } from 'chai'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import { CurrencyCode, CurrencyBoundary } from '@abx-types/reference-data'
import * as coreOperations from '../../../../core'
import * as helperOperations from '../kinesis_coin_deposit_follower_helpers'
import { triggerKinesisCoinDepositFollower } from '../kinesis_coin_deposit_follower'
import { AccountStatus } from '@abx-types/account'
import { FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION, NEW_KINESIS_DEPOSIT_REQUESTS_QUEUE_URL } from '../../../../core'
import Decimal from 'decimal.js'
import { DepositRequestStatus } from '@abx-types/deposit'

describe('triggerKinesisCoinDepositFollower', () => {
  const kauCurrency = {
    id: 1,
    code: CurrencyCode.kau,
  }
  let storeDepositRequestsStub
  const lastEntityProcessedIdentifier = 'foo-tx-hash'
  const fiatValueOfOneCryptoCurrency = 10
  const currencyBoundary: CurrencyBoundary = {
    maxDecimals: 5,
    minAmount: 0.00001,
    currencyId: kauCurrency.id,
    currencyCode: kauCurrency.code,
  }
  let getLatestTransactionsStub
  let onChainCurrencyGatewayStub

  beforeEach(() => {
    sinon.stub(referenceDataOperations, 'findCurrencyForCode').resolves(kauCurrency)
    sinon.stub(coreOperations, 'getBlockchainFollowerDetailsForCurrency').resolves({
      lastEntityProcessedIdentifier,
    })
    sinon.stub(helperOperations, 'getBoundaryAndLatestFiatValuePair').resolves({ fiatValueOfOneCryptoCurrency, currencyBoundary })
    storeDepositRequestsStub = sinon.stub(coreOperations, 'storeDepositRequests').callsFake(async (args) => args)

    getLatestTransactionsStub = sinon.stub()
    onChainCurrencyGatewayStub = {
      getLatestTransactions: getLatestTransactionsStub,
    } as any
  })

  afterEach(() => sinon.restore())

  it('should not store anything if no new deposit transactions found', async () => {
    sinon.stub(helperOperations, 'createPublicKeyToDepositorDetailsMap').resolves(
      new Map([
        [
          'foo',
          {
            depositAddress: {
              publicKey: 'foo',
            } as any,
            accountStatus: AccountStatus.kycVerified,
          },
        ],
      ]),
    )
    getLatestTransactionsStub.resolves([])

    await triggerKinesisCoinDepositFollower(onChainCurrencyGatewayStub, kauCurrency.code)
    expect(storeDepositRequestsStub.calledOnce).to.eql(false)
  })

  it('should not store anything if no transactions ', async () => {
    sinon.stub(helperOperations, 'createPublicKeyToDepositorDetailsMap').resolves(
      new Map([
        [
          'foo',
          {
            depositAddress: {
              publicKey: 'foo',
            } as any,
            accountStatus: AccountStatus.kycVerified,
          },
        ],
      ]),
    )
    getLatestTransactionsStub.resolves([
      {
        to: 'bar',
      },
    ])

    await triggerKinesisCoinDepositFollower(onChainCurrencyGatewayStub, kauCurrency.code)
    expect(storeDepositRequestsStub.calledOnce).to.eql(false)
  })

  it('should store new transaction if it was received by a deposit address', async () => {
    const depositAddress = 'foo'
    const depositFrom = 'from'
    const amount = 12
    const txHash = 'txhash-fal'

    sinon.stub(helperOperations, 'createPublicKeyToDepositorDetailsMap').resolves(
      new Map([
        [
          depositAddress,
          {
            depositAddress: {
              publicKey: depositAddress,
            } as any,
            accountStatus: AccountStatus.kycVerified,
          },
        ],
      ]),
    )
    getLatestTransactionsStub.resolves([
      {
        to: depositAddress,
        from: depositFrom,
        amount,
        txHash,
      },
    ])
    const updateBlockchainFollowerDetailsForCurrencyStub = sinon.stub(coreOperations, 'updateBlockchainFollowerDetailsForCurrency').resolves()
    const pushRequestForProcessingStub = sinon.stub(coreOperations, 'pushRequestForProcessing').resolves()

    await triggerKinesisCoinDepositFollower(onChainCurrencyGatewayStub, kauCurrency.code)
    const depositRequest = {
      depositAddress: {
        publicKey: depositAddress,
      },
      from: depositFrom,
      amount,
      depositTxHash: txHash,
      fiatCurrencyCode: FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION,
      fiatConversion: new Decimal(amount).times(fiatValueOfOneCryptoCurrency).toNumber(),
      status: DepositRequestStatus.pendingHoldingsTransaction,
    } as any

    expect(storeDepositRequestsStub.calledWith([depositRequest])).to.eql(true)
    expect(updateBlockchainFollowerDetailsForCurrencyStub.calledWith(kauCurrency.id, txHash)).to.eql(true)
    expect(pushRequestForProcessingStub.calledWith([depositRequest], NEW_KINESIS_DEPOSIT_REQUESTS_QUEUE_URL)).to.eql(true)
  })
})
