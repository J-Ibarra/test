import sinon from 'sinon'
import { expect } from 'chai'

import { HoldingsTransactionConfirmationHandler } from '../../deposit-transaction-recording/HoldingsTransactionConfirmationHandler'
import * as coreOperations from '../../../../../core'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequestStatus } from '@abx-types/deposit'
import { HoldingsTransactionDispatcher, DepositCompleter } from '../../../../../core'

describe('HoldingsTransactionConfirmationHandler', () => {
  const holdingsTransactionConfirmationHandler = new HoldingsTransactionConfirmationHandler()
  const depositAddressId = 1

  afterEach(() => sinon.restore())

  it('should dispatchHoldingsTransactionForDepositRequests if blocked requests found', async () => {
    const blockedDepositRequests = [{ id: 1 }] as any
    const txHash = 'tx-hash-1'

    sinon.stub(coreOperations, 'findDepositRequestsForStatuses').resolves(blockedDepositRequests)
    const updateDepositRequestForHoldingsTxHashStub = sinon.stub(coreOperations, 'updateDepositRequestForHoldingsTxHash').resolves()

    const dispatchHoldingsTransactionForDepositRequestsStub = sinon
      .stub(HoldingsTransactionDispatcher.prototype, 'dispatchHoldingsTransactionForDepositRequests')
      .resolves(blockedDepositRequests)

    const depositCompleterStub = sinon
      .stub(DepositCompleter.prototype, 'completeDepositRequests')
      .resolves()
    await holdingsTransactionConfirmationHandler.handleHoldingsTransactionConfirmation(txHash, depositAddressId, CurrencyCode.bitcoin)

    expect(updateDepositRequestForHoldingsTxHashStub.calledWith(txHash, { status: DepositRequestStatus.completed })).to.eql(true)
    expect(dispatchHoldingsTransactionForDepositRequestsStub.calledWith(blockedDepositRequests, CurrencyCode.bitcoin)).to.eql(true)
    expect(depositCompleterStub.calledWith(blockedDepositRequests, CurrencyCode.bitcoin, DepositRequestStatus.pendingHoldingsTransactionConfirmation)).to.eql(true)
  })
})
