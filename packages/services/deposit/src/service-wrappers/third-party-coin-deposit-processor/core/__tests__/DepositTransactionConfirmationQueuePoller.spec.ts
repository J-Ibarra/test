import sinon from 'sinon'
import { expect } from 'chai'
import { DepositTransactionConfirmationQueuePoller } from '../holdings-transaction-creation/DepositTransactionConfirmationQueuePoller'
import * as coreOperations from '../../../../core'
import { CurrencyCode } from '@abx-types/reference-data'
import { HoldingsTransactionDispatcher } from '../holdings-transaction-creation/HoldingsTransactionDispatcher'

describe('DepositTransactionConfirmationQueuePoller', () => {
  const depositTransactionConfirmationQueuePoller = new DepositTransactionConfirmationQueuePoller()

  afterEach(() => sinon.restore())

  describe('processDepositAddressTransaction', () => {
    it('should transfer transaction amount when deposit request not found with the given transaction hash', async () => {
      sinon.stub(coreOperations, 'findDepositRequestByDepositTransactionHash').resolves(null)
      const transferTransactionAmountToHoldingsWalletStub = sinon.stub(
        HoldingsTransactionDispatcher.prototype,
        'transferTransactionAmountToHoldingsWallet',
      )

      const confirmedTransactionPayload = {
        txid: 'txid1',
        currency: CurrencyCode.bitcoin,
      } as any

      await depositTransactionConfirmationQueuePoller['processDepositAddressTransaction'](confirmedTransactionPayload)
      expect(transferTransactionAmountToHoldingsWalletStub.calledOnce).to.eql(false)
    })

    it('should transfer amount to holdings and update status to pendingHoldingsTransactionConfirmation', async () => {
      const depositRequest = {
        id: 1,
      } as any

      sinon.stub(coreOperations, 'findDepositRequestByDepositTransactionHash').resolves(depositRequest)
      const transferTransactionAmountToHoldingsWalletStub = sinon.stub(
        HoldingsTransactionDispatcher.prototype,
        'transferTransactionAmountToHoldingsWallet',
      )

      const confirmedTransactionPayload = {
        txid: 'txid1',
        currency: CurrencyCode.bitcoin,
      } as any

      await depositTransactionConfirmationQueuePoller['processDepositAddressTransaction'](confirmedTransactionPayload)
      expect(transferTransactionAmountToHoldingsWalletStub.calledWith(CurrencyCode.bitcoin, depositRequest)).to.eql(true)
    })
  })
})
