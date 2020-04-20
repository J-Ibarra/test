import sinon from 'sinon'
import { expect } from 'chai'

import { BlockedDepositRequestsHandler } from '../../deposit-transaction-recording/BlockedDepositRequestsHandler'
import { HoldingsTransactionDispatcher } from '../../holdings-transaction-creation/HoldingsTransactionDispatcher'
import * as coreOperations from '../../../../../core'
import { CurrencyCode } from '@abx-types/reference-data'

describe('BlockedDepositRequestsHandler', () => {
  const blockedDepositRequestsHandler = new BlockedDepositRequestsHandler()
  const depositAddressId = 1

  afterEach(() => sinon.restore())

  it('should dispatchHoldingsTransactionForDepositRequests if blocked requests found', async () => {
    const blockedDepositRequests = [{ id: 1 }] as any
    sinon.stub(coreOperations, 'findDepositRequestsForStatus').resolves(blockedDepositRequests)

    const dispatchHoldingsTransactionForDepositRequestsStub = sinon
      .stub(HoldingsTransactionDispatcher.prototype, 'dispatchHoldingsTransactionForDepositRequests')
      .resolves()

    await blockedDepositRequestsHandler.dispatchHoldingsTransactionForBlockedRequests(depositAddressId, CurrencyCode.bitcoin)

    expect(dispatchHoldingsTransactionForDepositRequestsStub.calledWith(blockedDepositRequests, CurrencyCode.bitcoin)).to.eql(true)
  })
})
