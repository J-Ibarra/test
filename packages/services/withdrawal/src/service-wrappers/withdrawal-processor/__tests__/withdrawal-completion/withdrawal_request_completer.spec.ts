import sinon from 'sinon'
import { expect } from 'chai'
import * as cryptoCompletionOperations from '../../core/withdrawal-completion/crypto'
import * as coreWithdrawalOperations from '../../../../core'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import * as blockchainOperations from '@abx-utils/blockchain-currency-gateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { completeWithdrawalRequest } from '../../core/withdrawal-completion/withdrawal_request_completer'
import { WithdrawalState } from '@abx-types/withdrawal'
import * as asyncMessagePublisherOperations from '@abx-utils/async-message-publisher'
import { WithdrawalStatusChangeRequestType, WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL } from '@abx-service-clients/withdrawal'

describe('withdrawal_request_completer', () => {
  const checkConfirmationOfTransactionStub = sinon.stub()
  const currencyМаnager = {
    getCurrencyFromTicker: () => ({
      checkConfirmationOfTransaction: checkConfirmationOfTransactionStub,
    }),
  }

  beforeEach(() => {
    sinon.stub(referenceDataOperations, 'findAllCurrencyCodes').resolves([])
    sinon.stub(blockchainOperations, 'getOnChainCurrencyManagerForEnvironment').returns(currencyМаnager)
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('natively implemented coins', () => {
    it('should check for confirmation for natively implemented coins and not process if transaction not confirmed', async () => {
      checkConfirmationOfTransactionStub.resolves(false)
      const findWithdrawalRequestByTxHashWithFeeRequestStub = sinon
        .stub(coreWithdrawalOperations, 'findWithdrawalRequestsByTxHashWithFeeRequest')
        .resolves([])

      await completeWithdrawalRequest({ txid: '12', currency: CurrencyCode.ethereum })
      expect(findWithdrawalRequestByTxHashWithFeeRequestStub.calledOnce).to.eql(false)
    })

    it('should trigger completion flow if transaction confirmed', async () => {
      const withdrawalRequest = { id: 1, state: WithdrawalState.holdingsTransactionCompleted, feeRequest: { id: 2 } }
      checkConfirmationOfTransactionStub.resolves(true)
      const findWithdrawalRequestByTxHashWithFeeRequestStub = sinon
        .stub(coreWithdrawalOperations, 'findWithdrawalRequestsByTxHashWithFeeRequest')
        .resolves([withdrawalRequest])
      const completeCryptoWithdrawalStub = sinon.stub(cryptoCompletionOperations, 'completeCryptoWithdrawal').resolves()

      await completeWithdrawalRequest({ txid: '12', currency: CurrencyCode.ethereum })

      expect(findWithdrawalRequestByTxHashWithFeeRequestStub.calledOnce).to.eql(true)
      expect(completeCryptoWithdrawalStub.getCall(0).args[0]).to.eql(withdrawalRequest)
      expect(completeCryptoWithdrawalStub.getCall(0).args[2]).to.eql(withdrawalRequest.feeRequest)
    })
  })

  describe('crypto provider implemented coins', () => {
    it('should not complete request when withdrawal request not found', async () => {
      sinon.stub(coreWithdrawalOperations, 'findWithdrawalRequestsByTxHashWithFeeRequest').resolves([])
      const completeCryptoWithdrawalStub = sinon.stub(cryptoCompletionOperations, 'completeCryptoWithdrawal').resolves()

      await completeWithdrawalRequest({ txid: '12', currency: CurrencyCode.ethereum })

      expect(completeCryptoWithdrawalStub.calledOnce).to.eql(false)
    })

    it('should complete request when withdrawal request found', async () => {
      const withdrawalRequest = { id: 1, state: WithdrawalState.holdingsTransactionCompleted, feeRequest: { id: 2 } }
      sinon.stub(coreWithdrawalOperations, 'findWithdrawalRequestsByTxHashWithFeeRequest').resolves([withdrawalRequest])
      const sendAsyncChangeMessageAsync = sinon.stub(asyncMessagePublisherOperations, 'sendAsyncChangeMessage').resolves()
      const completeCryptoWithdrawalStub = sinon.stub(cryptoCompletionOperations, 'completeCryptoWithdrawal').resolves()

      await completeWithdrawalRequest({ txid: '12', currency: CurrencyCode.ethereum })

      expect(completeCryptoWithdrawalStub.getCall(0).args[0]).to.eql(withdrawalRequest)
      expect(completeCryptoWithdrawalStub.getCall(0).args[2]).to.eql(withdrawalRequest.feeRequest)
      expect(sendAsyncChangeMessageAsync.calledOnce).to.eql(false)
    })

    it('should complete multiple withdrawal requests when multiple withdrawal requests found', async () => {
      const withdrawalRequest = { id: 1, state: WithdrawalState.holdingsTransactionCompleted, feeRequest: { id: 2 } }
      const withdrawalRequest2 = { id: 2, state: WithdrawalState.holdingsTransactionCompleted, feeRequest: { id: 2 } }
      sinon.stub(coreWithdrawalOperations, 'findWithdrawalRequestsByTxHashWithFeeRequest').resolves([withdrawalRequest, withdrawalRequest2])
      const sendAsyncChangeMessageAsync = sinon.stub(asyncMessagePublisherOperations, 'sendAsyncChangeMessage').resolves()
      const completeCryptoWithdrawalStub = sinon.stub(cryptoCompletionOperations, 'completeCryptoWithdrawal').resolves()

      await completeWithdrawalRequest({ txid: '12', currency: CurrencyCode.ethereum })

      expect(completeCryptoWithdrawalStub.getCall(0).args[0]).to.eql(withdrawalRequest)
      expect(completeCryptoWithdrawalStub.getCall(0).args[2]).to.eql(withdrawalRequest.feeRequest)
      expect(completeCryptoWithdrawalStub.getCall(1).args[0]).to.eql(withdrawalRequest2)
      expect(completeCryptoWithdrawalStub.getCall(1).args[2]).to.eql(withdrawalRequest2.feeRequest)
      expect(sendAsyncChangeMessageAsync.calledOnce).to.eql(false)
    })

    it('should trigger withdrawal for waiting requests if waiting requests exist', async () => {
      const waitingWithdrawalRequestId = 12
      const withdrawalRequest = { id: 1, state: WithdrawalState.holdingsTransactionCompleted, feeRequest: { id: 2 } }

      sinon.stub(coreWithdrawalOperations, 'findWithdrawalRequestsByTxHashWithFeeRequest').resolves([withdrawalRequest])
      const sendAsyncChangeMessageAsync = sinon.stub(asyncMessagePublisherOperations, 'sendAsyncChangeMessage').resolves()
      const completeCryptoWithdrawalStub = sinon.stub(cryptoCompletionOperations, 'completeCryptoWithdrawal').resolves()
      sinon.stub(referenceDataOperations, 'findCurrencyForCode').resolves({ id: 1, currency: CurrencyCode.bitcoin })

      sinon.stub(coreWithdrawalOperations, 'findWithdrawalRequests').resolves([
        {
          id: waitingWithdrawalRequestId,
        },
      ])
      await completeWithdrawalRequest({ txid: '12', currency: CurrencyCode.bitcoin })

      expect(completeCryptoWithdrawalStub.getCall(0).args[0]).to.eql(withdrawalRequest)
      expect(completeCryptoWithdrawalStub.getCall(0).args[2]).to.eql(withdrawalRequest.feeRequest)
      expect(
        sendAsyncChangeMessageAsync.calledWith({
          id: `pushNewCryptoWithdrawalRequestForProcessing-${waitingWithdrawalRequestId}`,
          type: WithdrawalStatusChangeRequestType.createCryptoWithdrawal,
          target: {
            local: WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL!,
            deployedEnvironment: WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL!,
          },
          payload: { isBatch: true, currency: CurrencyCode.bitcoin },
        }),
      ).to.eql(true)
    })

    it('should not trigger withdrawal for waiting requests if no waiting requests exist', async () => {
      const withdrawalRequest = { id: 1, state: WithdrawalState.holdingsTransactionCompleted, feeRequest: { id: 2 } }
      sinon.stub(coreWithdrawalOperations, 'findWithdrawalRequestsByTxHashWithFeeRequest').resolves([withdrawalRequest])
      sinon.stub(coreWithdrawalOperations, 'findWithdrawalRequests').resolves([])
      sinon.stub(referenceDataOperations, 'findCurrencyForCode').resolves({ id: 1, currency: CurrencyCode.bitcoin })

      const sendAsyncChangeMessageAsync = sinon.stub(asyncMessagePublisherOperations, 'sendAsyncChangeMessage').resolves()
      const completeCryptoWithdrawalStub = sinon.stub(cryptoCompletionOperations, 'completeCryptoWithdrawal').resolves()

      await completeWithdrawalRequest({ txid: '12', currency: CurrencyCode.bitcoin })

      expect(completeCryptoWithdrawalStub.getCall(0).args[0]).to.eql(withdrawalRequest)
      expect(completeCryptoWithdrawalStub.getCall(0).args[2]).to.eql(withdrawalRequest.feeRequest)
      expect(sendAsyncChangeMessageAsync.calledOnce).to.eql(false)
    })
  })
})
