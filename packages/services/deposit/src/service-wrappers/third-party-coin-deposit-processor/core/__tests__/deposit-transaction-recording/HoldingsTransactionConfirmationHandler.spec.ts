import sinon from 'sinon'
import { expect } from 'chai'

import { HoldingsTransactionConfirmationHandler } from '../../deposit-transaction-recording/HoldingsTransactionConfirmationHandler'
import { HoldingsTransactionDispatcher } from '../../holdings-transaction-creation/HoldingsTransactionDispatcher'
import * as coreOperations from '../../../../../core'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequestStatus } from '@abx-types/deposit'

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
      .resolves()

    await holdingsTransactionConfirmationHandler.handleHoldingsTransactionConfirmation(txHash, depositAddressId, CurrencyCode.bitcoin)

    expect(updateDepositRequestForHoldingsTxHashStub.calledWith(txHash, { status: DepositRequestStatus.completed })).to.eql(true)
    expect(dispatchHoldingsTransactionForDepositRequestsStub.calledWith(blockedDepositRequests, CurrencyCode.bitcoin)).to.eql(true)
  })
})
