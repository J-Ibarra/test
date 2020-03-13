import sinon from 'sinon'
import { expect } from 'chai'
import { HoldingsTransactionDispatcher } from '../holdings-transaction-creation/HoldingsTransactionDispatcher'
import { CurrencyCode } from '@abx-types/reference-data'
import * as accountClientOperations from '@abx-service-clients/account'
import * as balanceOperations from '@abx-service-clients/balance'
import * as blockchainCurrencyGateway from '@abx-utils/blockchain-currency-gateway'
import { SourceEventType } from '@abx-types/balance'
import * as depositRequestOperations from '../../../../core'
import { DepositRequestStatus } from '@abx-types/deposit'

describe('HoldingsTransactionDispatcher', () => {
  const holdingsTransactionDispatcher = new HoldingsTransactionDispatcher()
  const currency = CurrencyCode.bitcoin
  const transactionHash = 'txHash'
  const testKinesisRevenueAccount = {
    id: 'foo-bar-1',
  } as any

  const depositRequest = {
    id: 1,
    amount: 5,
    depositAddress: {
      id: 1,
      accountId: 'accc-id-1',
      currencyId: 2,
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
    it('should not create holdings transaction', async () => {
      sinon.stub(accountClientOperations, 'isAccountSuspended').resolves(true)
      const createPendingDepositStub = sinon.stub(balanceOperations, 'createPendingDeposit').resolves()

      await holdingsTransactionDispatcher.transferTransactionAmountToHoldingsWallet(currency, depositRequest, [])

      expect(createPendingDepositStub.calledOnce).to.eql(false)
    })

    it('should create holdings transaction when account not suspended, no joined requests', async () => {
      const transactionFee = '21'

      sinon.stub(accountClientOperations, 'isAccountSuspended').resolves(false)
      sinon.stub(accountClientOperations, 'findOrCreateKinesisRevenueAccount').resolves(testKinesisRevenueAccount)
      const createPendingWithdrawalStub = sinon.stub(balanceOperations, 'createPendingWithdrawal').resolves()

      const createPendingDepositStub = sinon.stub(balanceOperations, 'createPendingDeposit').resolves()
      const createTransactionStub = sinon.stub().resolves({
        txHash: transactionHash,
        transactionFee,
      })
      sinon.stub(blockchainCurrencyGateway.BlockchainFacade, 'getInstance').returns({
        createTransaction: createTransactionStub,
      } as any)
      const depositRequestOperationsStub = sinon.stub(depositRequestOperations, 'updateDepositRequest').resolves()

      await holdingsTransactionDispatcher.transferTransactionAmountToHoldingsWallet(currency, depositRequest, [])

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
        createTransactionStub.calledWith({
          senderAddress: {
            privateKey: depositRequest.depositAddress.encryptedPrivateKey!,
            wif: depositRequest.depositAddress.encryptedWif!,
            address: depositRequest.depositAddress.address!,
          },
          receiverAddress: process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!,
          amount: depositRequest.amount,
        }),
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
            currencyId: depositRequest.depositAddress.currencyId,
            sourceEventId: depositRequest.id!,
            sourceEventType: SourceEventType.currencyDeposit,
          },
        }),
      ).to.eql(true)
    })

    it('should create holdings transaction when account not suspended, with joined requests', async () => {
      const transactionFee = '21'

      sinon.stub(accountClientOperations, 'isAccountSuspended').resolves(false)
      sinon.stub(accountClientOperations, 'findOrCreateKinesisRevenueAccount').resolves(testKinesisRevenueAccount)
      const createPendingWithdrawalStub = sinon.stub(balanceOperations, 'createPendingWithdrawal').resolves()

      const createPendingDepositStub = sinon.stub(balanceOperations, 'createPendingDeposit').resolves()
      const createTransactionStub = sinon.stub().resolves({
        txHash: transactionHash,
        transactionFee,
      })
      sinon.stub(blockchainCurrencyGateway.BlockchainFacade, 'getInstance').returns({
        createTransaction: createTransactionStub,
      } as any)
      const depositRequestUpdateStub = sinon.stub(depositRequestOperations, 'updateDepositRequest').resolves()
      const updateAllDepositRequestsStub = sinon.stub(depositRequestOperations, 'updateAllDepositRequests').resolves()

      const joinedRequestIds = [1, 2]

      await holdingsTransactionDispatcher.transferTransactionAmountToHoldingsWallet(currency, depositRequest, joinedRequestIds)

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
        createTransactionStub.calledWith({
          senderAddress: {
            privateKey: depositRequest.depositAddress.encryptedPrivateKey!,
            wif: depositRequest.depositAddress.encryptedWif!,
            address: depositRequest.depositAddress.address!,
          },
          receiverAddress: process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!,
          amount: depositRequest.amount,
        }),
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
            currencyId: depositRequest.depositAddress.currencyId,
            sourceEventId: depositRequest.id!,
            sourceEventType: SourceEventType.currencyDeposit,
          },
        }),
      ).to.eql(true)
    })
  })
})
