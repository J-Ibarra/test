import sinon from 'sinon'
import { expect } from 'chai'
import * as cryptoCompletionOperations from '../../core/withdrawal-completion/crypto'
import * as coreWithdrawalOperations from '../../../../core'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import * as blockchainOperations from '@abx-utils/blockchain-currency-gateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { completeWithdrawalRequest } from '../../core/withdrawal-completion/withdrawal_request_completer'
import { WithdrawalState } from '@abx-types/withdrawal'

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
        .stub(coreWithdrawalOperations, 'findWithdrawalRequestByTxHashWithFeeRequest')
        .resolves()

      await completeWithdrawalRequest({ txid: '12', currency: CurrencyCode.ethereum })
      expect(findWithdrawalRequestByTxHashWithFeeRequestStub.calledOnce).to.eql(false)
    })

    it('should trigger completion flow if transaction confirmed', async () => {
      const withdrawalRequest = { id: 1, state: WithdrawalState.holdingsTransactionCompleted, feeRequest: { id: 2 } }
      checkConfirmationOfTransactionStub.resolves(true)
      const findWithdrawalRequestByTxHashWithFeeRequestStub = sinon
        .stub(coreWithdrawalOperations, 'findWithdrawalRequestByTxHashWithFeeRequest')
        .resolves(withdrawalRequest)
      const completeCryptoWithdrawalStub = sinon.stub(cryptoCompletionOperations, 'completeCryptoWithdrawal').resolves()

      await completeWithdrawalRequest({ txid: '12', currency: CurrencyCode.ethereum })

      expect(findWithdrawalRequestByTxHashWithFeeRequestStub.calledOnce).to.eql(true)
      expect(completeCryptoWithdrawalStub.getCall(0).args[0]).to.eql(withdrawalRequest)
      expect(completeCryptoWithdrawalStub.getCall(0).args[2]).to.eql(withdrawalRequest.feeRequest)
    })
  })

  describe('crypto provider implemented coins', () => {
    it('should not complete request when withdrawal request not found', async () => {
      sinon.stub(coreWithdrawalOperations, 'findWithdrawalRequestByTxHashWithFeeRequest').resolves()
      const completeCryptoWithdrawalStub = sinon.stub(cryptoCompletionOperations, 'completeCryptoWithdrawal').resolves()

      await completeWithdrawalRequest({ txid: '12', currency: CurrencyCode.ethereum })

      expect(completeCryptoWithdrawalStub.calledOnce).to.eql(false)
    })

    it('should complete request when withdrawal request found', async () => {
      const withdrawalRequest = { id: 1, state: WithdrawalState.holdingsTransactionCompleted, feeRequest: { id: 2 } }
      sinon.stub(coreWithdrawalOperations, 'findWithdrawalRequestByTxHashWithFeeRequest').resolves(withdrawalRequest)
      const completeCryptoWithdrawalStub = sinon.stub(cryptoCompletionOperations, 'completeCryptoWithdrawal').resolves()

      await completeWithdrawalRequest({ txid: '12', currency: CurrencyCode.ethereum })

      expect(completeCryptoWithdrawalStub.getCall(0).args[0]).to.eql(withdrawalRequest)
      expect(completeCryptoWithdrawalStub.getCall(0).args[2]).to.eql(withdrawalRequest.feeRequest)
    })
  })
})
