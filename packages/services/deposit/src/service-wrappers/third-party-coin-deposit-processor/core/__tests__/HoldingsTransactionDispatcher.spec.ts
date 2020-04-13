import sinon from 'sinon'
import { expect } from 'chai'
import { HoldingsTransactionDispatcher } from '../holdings-transaction-creation/HoldingsTransactionDispatcher'
import * as accountClientOperations from '@abx-service-clients/account'
import * as balanceOperations from '@abx-service-clients/balance'
import { SourceEventType } from '@abx-types/balance'
import * as depositRequestOperations from '../../../../core'
import { DepositRequestStatus } from '@abx-types/deposit'
import * as utilsStub from '../utils'
import * as coreOperations from '../../../../core'
import * as blockchainOperations from '@abx-utils/blockchain-currency-gateway'
import { CurrencyCode } from '@abx-types/reference-data'

describe('HoldingsTransactionDispatcher', () => {
  const holdingsTransactionDispatcher = new HoldingsTransactionDispatcher()
  const currencyId = 2
  const transactionHash = 'txHash'
  const transactionFee = '21'
  const testKinesisRevenueAccount = {
    id: 'foo-bar-1',
  } as any
  const transferToExchangeHoldingsFromStub = sinon.stub().resolves({
    txHash: transactionHash,
    transactionFee,
  })
  let onChainCurrencyManagerStub
  let findDepositRequestsWithInsufficientAmountStub
  let findDepositRequestByDepositTransactionHashStub
  let isAccountSuspendedStub
  let createPendingWithdrawalStub
  let createPendingDepositStub
  let transferTransactionAmountToHoldingsWalletSpy

  const onChainCurrencyGateway = {} as any
  const onChainCurrencyGatewayStub = {
    getCurrencyFromTicker: sinon.stub().returns(onChainCurrencyGateway),
    transferToExchangeHoldingsFrom: transferToExchangeHoldingsFromStub,
  } as any
  const confirmedTransactionPayload = {
    txid: 'txid1',
    currency: CurrencyCode.bitcoin,
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

    onChainCurrencyManagerStub = {
        getCurrencyFromTicker: sinon.stub().returns(onChainCurrencyGatewayStub),
        transferToExchangeHoldingsFrom: transferToExchangeHoldingsFromStub
      } as any
      sinon.stub(blockchainOperations, 'getOnChainCurrencyManagerForEnvironment').returns(onChainCurrencyManagerStub)
      transferTransactionAmountToHoldingsWalletSpy = sinon.spy(holdingsTransactionDispatcher as any, 'transferTransactionAmountToHoldingsWallet')
      
      findDepositRequestsWithInsufficientAmountStub = sinon.stub(coreOperations, 'findDepositRequestsWithInsufficientAmount').resolves([])
      findDepositRequestByDepositTransactionHashStub = sinon.stub(coreOperations, 'findDepositRequestByDepositTransactionHash').resolves(depositRequest)
      
      isAccountSuspendedStub = sinon.stub(accountClientOperations, 'isAccountSuspended').resolves(false)
      sinon.stub(accountClientOperations, 'findOrCreateKinesisRevenueAccount').resolves(testKinesisRevenueAccount)
      sinon.stub(utilsStub, 'getDepositTransactionFeeCurrencyId').resolves(currencyId)
      createPendingWithdrawalStub = sinon.stub(balanceOperations, 'createPendingWithdrawal').resolves()
      createPendingDepositStub = sinon.stub(balanceOperations, 'createPendingDeposit').resolves()
  })

  afterEach(() => sinon.restore())

  describe('processDepositAddressTransaction', () => {
    it('should not transfer transaction amount when deposit request not found with the given transaction hash', async () => {
      findDepositRequestByDepositTransactionHashStub.resolves(null)

      await holdingsTransactionDispatcher.processDepositAddressTransaction(confirmedTransactionPayload.txid, confirmedTransactionPayload.currency)
      expect(transferTransactionAmountToHoldingsWalletSpy.calledOnce).to.eql(false)
    })

    it('should transfer amount to holdings and update status to pendingHoldingsTransactionConfirmation, no pre-existing requests', async () => {
      await holdingsTransactionDispatcher.processDepositAddressTransaction(confirmedTransactionPayload.txid, confirmedTransactionPayload.currency)
      expect(transferTransactionAmountToHoldingsWalletSpy.calledWith(depositRequest, [], onChainCurrencyGatewayStub)).to.eql(true)
    })

    it('should transfer amount to holdings and update status to pendingHoldingsTransactionConfirmation, with pre-existing requests', async () => {
      const preExistingDepositTransactionAmount = 12
      const preExistingDepositTransactionId = 2

      findDepositRequestsWithInsufficientAmountStub.resolves([
        {
          id: preExistingDepositTransactionId,
          amount: preExistingDepositTransactionAmount,
        },
      ])

      await holdingsTransactionDispatcher.processDepositAddressTransaction(confirmedTransactionPayload.txid, confirmedTransactionPayload.currency)
      expect(
        transferTransactionAmountToHoldingsWalletSpy.calledWith(
          { ...depositRequest, amount: depositRequest.amount + preExistingDepositTransactionAmount },
          [preExistingDepositTransactionId],
          onChainCurrencyGatewayStub,
        ),
      ).to.eql(true)
    })
  })

  describe('transferTransactionAmountToHoldingsWallet', () => {
    it('should not create holdings transaction when account suspended', async () => {
      isAccountSuspendedStub.resolves(true)
      
      await holdingsTransactionDispatcher.processDepositAddressTransaction(confirmedTransactionPayload.txid, confirmedTransactionPayload.currency)

      expect(createPendingDepositStub.calledOnce).to.eql(false)
    })

    it('should create holdings transaction when account not suspended, no joined requests', async () => {
      const depositRequestOperationsStub = sinon.stub(depositRequestOperations, 'updateDepositRequest').resolves()

      await holdingsTransactionDispatcher.processDepositAddressTransaction(confirmedTransactionPayload.txid, confirmedTransactionPayload.currency)
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
      const depositRequestUpdateStub = sinon.stub(depositRequestOperations, 'updateDepositRequest').resolves()
      const updateAllDepositRequestsStub = sinon.stub(depositRequestOperations, 'updateAllDepositRequests').resolves()

      const joinedRequestIds = [1, 2]

      await holdingsTransactionDispatcher.processDepositAddressTransaction(confirmedTransactionPayload.txid, confirmedTransactionPayload.currency)

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
            currencyId: currencyId,
            sourceEventId: depositRequest.id!,
            sourceEventType: SourceEventType.currencyDeposit,
          },
        }),
      ).to.eql(true)
    })
  })
})