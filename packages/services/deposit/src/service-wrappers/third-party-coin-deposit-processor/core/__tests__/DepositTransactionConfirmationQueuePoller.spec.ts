import sinon from 'sinon'
import { expect } from 'chai'
import { DepositTransactionConfirmationQueuePoller } from '../holdings-transaction-creation/DepositTransactionConfirmationQueuePoller'
import * as coreOperations from '../../../../core'
import { CurrencyCode } from '@abx-types/reference-data'
import { HoldingsTransactionDispatcher } from '../holdings-transaction-creation/HoldingsTransactionDispatcher'
import * as asyncMessagePublisherOperations from '@abx-utils/async-message-publisher'
import { DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE_URL } from '../constants'

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

    it('should transfer amount to holdings and update status to pendingHoldingsTransactionConfirmation, no pre-existing requests', async () => {
      const depositRequest = {
        id: 1,
        amount: 5,
      } as any
      const holdingsTransactionHash = 'tx-hash-a'

      sinon.stub(coreOperations, 'findDepositRequestsWithInsufficientAmount').resolves([])
      sinon.stub(coreOperations, 'findDepositRequestByDepositTransactionHash').resolves(depositRequest)
      const transferTransactionAmountToHoldingsWalletStub = sinon
        .stub(HoldingsTransactionDispatcher.prototype, 'transferTransactionAmountToHoldingsWallet')
        .resolves(holdingsTransactionHash)

      const confirmedTransactionPayload = {
        txid: 'txid1',
        currency: CurrencyCode.bitcoin,
      } as any

      const sendAsyncChangeMessageStub = sinon.stub(asyncMessagePublisherOperations, 'sendAsyncChangeMessage').resolves()
      await depositTransactionConfirmationQueuePoller['processDepositAddressTransaction'](confirmedTransactionPayload)
      expect(transferTransactionAmountToHoldingsWalletStub.calledWith(CurrencyCode.bitcoin, depositRequest, [])).to.eql(true)

      expect(
        sendAsyncChangeMessageStub.calledWith({
          type: 'holdings-transaction-sent',
          target: {
            local: DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE_URL!,
            deployedEnvironment: DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE_URL!,
          },
          payload: {
            txid: holdingsTransactionHash,
            currency: confirmedTransactionPayload.currency,
          },
        }),
      ).to.eql(true)
    })

    it('should transfer amount to holdings and update status to pendingHoldingsTransactionConfirmation, with pre-existing requests', async () => {
      const depositRequest = {
        id: 1,
        amount: 5,
      } as any
      const holdingsTransactionHash = 'tx-hash-a'
      const preExistingDepositTransactionAmount = 12
      const preExistingDepositTransactionId = 2

      sinon.stub(coreOperations, 'findDepositRequestsWithInsufficientAmount').resolves([
        {
          id: preExistingDepositTransactionId,
          amount: preExistingDepositTransactionAmount,
        },
      ])
      sinon.stub(coreOperations, 'findDepositRequestByDepositTransactionHash').resolves(depositRequest)
      const transferTransactionAmountToHoldingsWalletStub = sinon
        .stub(HoldingsTransactionDispatcher.prototype, 'transferTransactionAmountToHoldingsWallet')
        .resolves(holdingsTransactionHash)

      const confirmedTransactionPayload = {
        txid: 'txid1',
        currency: CurrencyCode.bitcoin,
      } as any

      const sendAsyncChangeMessageStub = sinon.stub(asyncMessagePublisherOperations, 'sendAsyncChangeMessage').resolves()
      await depositTransactionConfirmationQueuePoller['processDepositAddressTransaction'](confirmedTransactionPayload)
      expect(
        transferTransactionAmountToHoldingsWalletStub.calledWith(
          CurrencyCode.bitcoin,
          { ...depositRequest, amount: depositRequest.amount + preExistingDepositTransactionAmount },
          [preExistingDepositTransactionId],
        ),
      ).to.eql(true)

      expect(
        sendAsyncChangeMessageStub.calledWith({
          type: 'holdings-transaction-sent',
          target: {
            local: DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE_URL!,
            deployedEnvironment: DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE_URL!,
          },
          payload: {
            txid: holdingsTransactionHash,
            currency: confirmedTransactionPayload.currency,
          },
        }),
      ).to.eql(true)
    })
  })
})
