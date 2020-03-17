import sinon from 'sinon'
import { expect } from 'chai'
import { HoldingsTransactionDispatcher } from '../holdings-transaction-creation/HoldingsTransactionDispatcher'
import * as accountClientOperations from '@abx-service-clients/account'
import * as balanceOperations from '@abx-service-clients/balance'
import { SourceEventType } from '@abx-types/balance'
import * as depositRequestOperations from '../../../../core'
import { DepositRequestStatus } from '@abx-types/deposit'
import * as utilsStub from '../utils'

describe('HoldingsTransactionDispatcher', () => {
  const holdingsTransactionDispatcher = new HoldingsTransactionDispatcher()
  const currencyId = 2
  const transactionHash = 'txHash'
  const testKinesisRevenueAccount = {
    id: 'foo-bar-1',
  } as any
  const transferToExchangeHoldingsFromStub = sinon.stub()
  const onChainCurrencyGatewayStub = {
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
    },
  } as any
  const bitcoinHoldingsAddress = 'btc-holdings'
  const depositConfirmationCallbackUrl = 'callback-url'

  beforeEach(() => {
    process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS = bitcoinHoldingsAddress
    process.env.DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_CALLBACK_URL = depositConfirmationCallbackUrl
  })

  afterEach(() => sinon.restore())

  describe('transferTransactionAmountToHoldingsWallet', () => {
    it('should not create holdings transaction when account suspended', async () => {
      sinon.stub(accountClientOperations, 'isAccountSuspended').resolves(true)
      const createPendingDepositStub = sinon.stub(balanceOperations, 'createPendingDeposit').resolves()

      await holdingsTransactionDispatcher.transferTransactionAmountToHoldingsWallet(depositRequest, [], onChainCurrencyGatewayStub)

      expect(createPendingDepositStub.calledOnce).to.eql(false)
    })

    it('should create holdings transaction when account not suspended, no joined requests', async () => {
      const transactionFee = '21'

      sinon.stub(accountClientOperations, 'isAccountSuspended').resolves(false)
      sinon.stub(accountClientOperations, 'findOrCreateKinesisRevenueAccount').resolves(testKinesisRevenueAccount)
      sinon.stub(utilsStub, 'getDepositTransactionFeeCurrencyId').resolves(currencyId)
      const createPendingWithdrawalStub = sinon.stub(balanceOperations, 'createPendingWithdrawal').resolves()

      const createPendingDepositStub = sinon.stub(balanceOperations, 'createPendingDeposit').resolves()
      transferToExchangeHoldingsFromStub.resolves({
        txHash: transactionHash,
        transactionFee,
      })

      const depositRequestOperationsStub = sinon.stub(depositRequestOperations, 'updateDepositRequest').resolves()

      await holdingsTransactionDispatcher.transferTransactionAmountToHoldingsWallet(depositRequest, [], onChainCurrencyGatewayStub)

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
          },
          depositRequest.amount,
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
      const transactionFee = '21'
      const transactionCurrencyId = 1

      sinon.stub(utilsStub, 'getDepositTransactionFeeCurrencyId').resolves(transactionCurrencyId)
      sinon.stub(accountClientOperations, 'isAccountSuspended').resolves(false)
      sinon.stub(accountClientOperations, 'findOrCreateKinesisRevenueAccount').resolves(testKinesisRevenueAccount)
      const createPendingWithdrawalStub = sinon.stub(balanceOperations, 'createPendingWithdrawal').resolves()

      const createPendingDepositStub = sinon.stub(balanceOperations, 'createPendingDeposit').resolves()
      transferToExchangeHoldingsFromStub.resolves({
        txHash: transactionHash,
        transactionFee,
      })
      const depositRequestUpdateStub = sinon.stub(depositRequestOperations, 'updateDepositRequest').resolves()
      const updateAllDepositRequestsStub = sinon.stub(depositRequestOperations, 'updateAllDepositRequests').resolves()

      const joinedRequestIds = [1, 2]

      await holdingsTransactionDispatcher.transferTransactionAmountToHoldingsWallet(depositRequest, joinedRequestIds, onChainCurrencyGatewayStub)

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
          },
          depositRequest.amount,
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
        updateAllDepositRequestsStub.calledWith(joinedRequestIds, {
          holdingsTxHash: transactionHash,
          status: DepositRequestStatus.pendingCompletion,
        }),
      )

      expect(
        createPendingWithdrawalStub.calledWith({
          pendingWithdrawalParams: {
            accountId: testKinesisRevenueAccount.id,
            amount: Number(transactionFee),
            currencyId: transactionCurrencyId,
            sourceEventId: depositRequest.id!,
            sourceEventType: SourceEventType.currencyDeposit,
          },
        }),
      ).to.eql(true)
    })
  })
})
