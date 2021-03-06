import sinon from 'sinon'
import { expect } from 'chai'
import * as accountClientOperations from '@abx-service-clients/account'
import * as balanceOperations from '@abx-service-clients/balance'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import { SourceEventType } from '@abx-types/balance'
import * as depositRequestOperations from '..'
import { DepositRequestStatus } from '@abx-types/deposit'
import * as blockchainOperations from '@abx-utils/blockchain-currency-gateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { HoldingsTransactionDispatcher } from '..'
import { DepositAmountCalculator } from '../DepositAmountCalculator'

describe('HoldingsTransactionDispatcher', () => {
  const holdingsTransactionDispatcher = new HoldingsTransactionDispatcher()
  const currencyId = 2
  const transactionHash = 'txHash'
  const transactionFee = '21'
  const transactionFeeCap = 12
  const transactionFeeIncrement = 11
  const testKinesisRevenueAccount = {
    id: 'foo-bar-1',
  } as any
  const transferToExchangeHoldingsFromStub = sinon.stub().resolves({
    txHash: transactionHash,
    transactionFee,
  })
  let onChainCurrencyManagerStub
  let isAccountSuspendedStub
  let createPendingWithdrawalStub
  let createPendingDepositStub

  const onChainCurrencyGateway = {} as any
  const onChainCurrencyGatewayStub = {
    getCurrencyFromTicker: sinon.stub().returns(onChainCurrencyGateway),
    transferToExchangeHoldingsFrom: transferToExchangeHoldingsFromStub,
  } as any
  const depositRequest = {
    id: 1,
    amount: 5,
    depositAddress: {
      id: 1,
      accountId: 'accc-id-1',
      currencyId,
      encryptedPrivateKey: '10',
      encryptedWif: '12',
      address: 'addr',
      publicKey: 'publicKey',
    },
  } as any

  beforeEach(() => {
    onChainCurrencyManagerStub = {
      getCurrencyFromTicker: sinon.stub().returns(onChainCurrencyGatewayStub),
      transferToExchangeHoldingsFrom: transferToExchangeHoldingsFromStub,
    } as any
    sinon.stub(blockchainOperations, 'getOnChainCurrencyManagerForEnvironment').returns(onChainCurrencyManagerStub)

    isAccountSuspendedStub = sinon.stub(accountClientOperations, 'isAccountSuspended').resolves(false)
    sinon.stub(accountClientOperations, 'findOrCreateKinesisRevenueAccount').resolves(testKinesisRevenueAccount)
    sinon.stub(depositRequestOperations, 'getDepositTransactionFeeCurrencyId').resolves(currencyId)
    createPendingWithdrawalStub = sinon.stub(balanceOperations, 'createPendingWithdrawal').resolves()
    createPendingDepositStub = sinon.stub(balanceOperations, 'createPendingDeposit').resolves()
  })

  afterEach(() => sinon.restore())

  describe('transferTransactionAmountToHoldingsWallet', () => {
    it('should not create holdings transaction when account suspended', async () => {
      isAccountSuspendedStub.resolves(true)

      await holdingsTransactionDispatcher.dispatchHoldingsTransactionForDepositRequests([depositRequest], CurrencyCode.bitcoin)

      expect(createPendingDepositStub.notCalled).to.eql(true)
    })

    it('should create holdings transaction when account not suspended, no joined requests', async () => {
      const depositRequestOperationsStub = sinon.stub(depositRequestOperations, 'updateDepositRequest').resolves()
      sinon.stub(DepositAmountCalculator.prototype, 'computeTotalAmountToTransfer').resolves({
        totalAmount: depositRequest.amount,
        depositsRequestsWithInsufficientStatus: [],
      })
      sinon.stub(depositRequestOperations, 'findDepositRequestsForIds').resolves([depositRequest])
      sinon.stub(referenceDataOperations, 'getWithdrawalConfigForCurrency').resolves({
        transactionFeeCap,
        transactionFeeIncrement,
      })

      await holdingsTransactionDispatcher.dispatchHoldingsTransactionForDepositRequests([depositRequest], CurrencyCode.bitcoin)

      expect(
        createPendingDepositStub.calledWith({
          accountId: depositRequest.depositAddress.accountId,
          amount: depositRequest.amount,
          currencyId: depositRequest.depositAddress.currencyId,
          sourceEventId: depositRequest.id!,
          sourceEventType: SourceEventType.currencyDepositRequest,
        }),
      ).to.eql(true)

      expect(
        transferToExchangeHoldingsFromStub.calledWith(
          {
            privateKey: depositRequest.depositAddress.encryptedPrivateKey!,
            wif: depositRequest.depositAddress.encryptedWif!,
            address: depositRequest.depositAddress.address!,
            publicKey: depositRequest.depositAddress.publicKey!,
          },
          depositRequest.amount,
          transactionFeeCap,
          transactionFeeIncrement,
        ),
      ).to.eql(true)

      expect(
        depositRequestOperationsStub.calledWith(depositRequest.id, {
          holdingsTxHash: transactionHash,
          status: DepositRequestStatus.pendingCompletion,
          holdingsTxFee: Number(),
        }),
      )

      expect(
        createPendingWithdrawalStub.calledWith({
          pendingWithdrawalParams: {
            accountId: testKinesisRevenueAccount.id,
            amount: Number(transactionFee),
            currencyId,
            sourceEventId: depositRequest.id!,
            sourceEventType: SourceEventType.currencyDeposit,
          },
        }),
      ).to.eql(true)
    })

    it('should create holdings transaction when account not suspended, with joined requests', async () => {
      const depositRequestUpdateStub = sinon.stub(depositRequestOperations, 'updateDepositRequest').resolves()
      const updateAllDepositRequestsStub = sinon.stub(depositRequestOperations, 'updateAllDepositRequests').resolves()
      const depositsRequestsWithInsufficientStatus = [{ id: 1 }, { id: 2 }] as any

      sinon.stub(DepositAmountCalculator.prototype, 'computeTotalAmountToTransfer').resolves({
        totalAmount: depositRequest.amount,
        depositsRequestsWithInsufficientStatus,
      })
      sinon.stub(depositRequestOperations, 'findDepositRequestsForIds').resolves([depositRequest, ...depositsRequestsWithInsufficientStatus])
      sinon.stub(referenceDataOperations, 'getWithdrawalConfigForCurrency').resolves({
        transactionFeeCap,
        transactionFeeIncrement,
      })

      await holdingsTransactionDispatcher.dispatchHoldingsTransactionForDepositRequests([depositRequest], CurrencyCode.bitcoin)

      expect(
        createPendingDepositStub.calledWith({
          accountId: depositRequest.depositAddress.accountId,
          amount: depositRequest.amount,
          currencyId: depositRequest.depositAddress.currencyId,
          sourceEventId: depositRequest.id!,
          sourceEventType: SourceEventType.currencyDepositRequest,
        }),
      ).to.eql(true)

      expect(
        transferToExchangeHoldingsFromStub.calledWith(
          {
            privateKey: depositRequest.depositAddress.encryptedPrivateKey!,
            wif: depositRequest.depositAddress.encryptedWif!,
            address: depositRequest.depositAddress.address!,
            publicKey: depositRequest.depositAddress.publicKey!,
          },
          depositRequest.amount,
          transactionFeeCap,
          transactionFeeIncrement,
        ),
      ).to.eql(true)

      expect(
        depositRequestUpdateStub.calledWith(depositRequest.id, {
          holdingsTxHash: transactionHash,
          status: DepositRequestStatus.pendingCompletion,
          holdingsTxFee: Number(),
        }),
      )
      expect(
        updateAllDepositRequestsStub.calledWith(
          depositsRequestsWithInsufficientStatus.map(({ id }) => id),
          {
            holdingsTxHash: transactionHash,
          },
        ),
      )

      expect(
        createPendingWithdrawalStub.calledWith({
          pendingWithdrawalParams: {
            accountId: testKinesisRevenueAccount.id,
            amount: Number(transactionFee),
            currencyId: currencyId,
            sourceEventId: depositRequest.id!,
            sourceEventType: SourceEventType.currencyDeposit,
          },
        }),
      ).to.eql(true)
    })
  })
})
