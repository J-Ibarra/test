import { HoldingsTransactionConfirmationQueuePoller } from '../deposit-completion/HoldingsTransactionConfirmationQueuePoller'
import { CurrencyCode } from '@abx-types/reference-data'
import sinon from 'sinon'
import { expect } from 'chai'
import * as coreOperations from '../../../../core'
import { DepositCompleter } from '../deposit-completion/DepositCompleter'

describe('HoldingsTransactionConfirmationQueuePoller', () => {
  const holdingsTransactionConfirmationQueuePoller = new HoldingsTransactionConfirmationQueuePoller()

  afterEach(() => sinon.restore())

  describe('completeDepositRequest', () => {
    it('should no complete request when deposit request not found', async () => {
      const transactionId = '1hsarca2134'

      sinon.stub(coreOperations, 'findDepositRequestsByHoldingsTransactionHash').resolves([])
      const completeDepositRequestStub = sinon.stub(DepositCompleter.prototype, 'completeDepositRequests').resolves()

      await holdingsTransactionConfirmationQueuePoller['completeDepositRequest']({ currency: CurrencyCode.bitcoin, txid: transactionId } as any)

      expect(completeDepositRequestStub.calledOnce).to.eql(false)
    })

    it('complete request when deposit request found', async () => {
      const transactionId = '1hsarca2134'

      const depositRequest = {
        id: 1,
      } as any
      sinon.stub(coreOperations, 'findDepositRequestsByHoldingsTransactionHash').resolves([depositRequest])
      const completeDepositRequestStub = sinon.stub(DepositCompleter.prototype, 'completeDepositRequests').resolves()
      await holdingsTransactionConfirmationQueuePoller['completeDepositRequest']({ currency: CurrencyCode.bitcoin, txid: transactionId } as any)

      expect(completeDepositRequestStub.calledWith([depositRequest])).to.eql(true)
    })
  })
})
