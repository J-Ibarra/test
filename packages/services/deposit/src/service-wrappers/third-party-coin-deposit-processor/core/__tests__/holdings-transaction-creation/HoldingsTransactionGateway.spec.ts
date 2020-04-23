import sinon from 'sinon'
import { expect } from 'chai'
import * as coreOperations from '../../../../../core'
import { HoldingsTransactionDispatcher } from '../../holdings-transaction-creation/HoldingsTransactionDispatcher'
import { HoldingsTransactionGateway } from '../../holdings-transaction-creation/HoldingsTransactionGateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequestStatus } from '@abx-types/deposit'

describe('HoldingsTransactionGateway', () => {
  const holdingsTransactionGateway = new HoldingsTransactionGateway()
  const txId = 'tx-id'

  afterEach(() => sinon.restore())

  it('should not dispatch transaction if deposit request not found', async () => {
    sinon.stub(coreOperations, 'findDepositRequestByDepositTransactionHash').resolves()

    const dispatchHoldingsTransactionForDepositRequestsStub = sinon
      .stub(HoldingsTransactionDispatcher.prototype, 'dispatchHoldingsTransactionForDepositRequests')
      .resolves()
    const updateDepositRequestStub = sinon.stub(coreOperations, 'updateDepositRequest').resolves()

    await holdingsTransactionGateway.dispatchHoldingsTransactionForConfirmedDepositRequest(txId, CurrencyCode.bitcoin)

    expect(updateDepositRequestStub.notCalled).to.eql(true)
    expect(dispatchHoldingsTransactionForDepositRequestsStub.notCalled).to.eql(true)
  })

  it('should not dispatch transaction and update request status to blockedForHoldingsTransactionConfirmation if a request in pendingHoldingsTransaction status present', async () => {
    const depositRequest = {
      id: 1,
    } as any
    sinon.stub(coreOperations, 'findDepositRequestByDepositTransactionHash').resolves(depositRequest)
    sinon.stub(coreOperations, 'findDepositRequestsForStatuses').resolves([{ id: 2 }, { id: 3 }])

    const dispatchHoldingsTransactionForDepositRequestsStub = sinon
      .stub(HoldingsTransactionDispatcher.prototype, 'dispatchHoldingsTransactionForDepositRequests')
      .resolves()
    const updateDepositRequestStub = sinon.stub(coreOperations, 'updateDepositRequest').resolves()

    await holdingsTransactionGateway.dispatchHoldingsTransactionForConfirmedDepositRequest(txId, CurrencyCode.bitcoin)

    expect(
      updateDepositRequestStub.calledWith(depositRequest.id, {
        status: DepositRequestStatus.blockedForHoldingsTransactionConfirmation,
      }),
    ).to.eql(true)
    expect(dispatchHoldingsTransactionForDepositRequestsStub.notCalled).to.eql(true)
  })

  it('should update deposit request in pendingHoldingsTransaction and dispatch transaction', async () => {
    const depositRequestId = 1
    sinon.stub(coreOperations, 'findDepositRequestByDepositTransactionHash').resolves({
      id: depositRequestId,
    })
    sinon.stub(coreOperations, 'findDepositRequestsForStatuses').resolves([])

    const dispatchHoldingsTransactionForDepositRequestsStub = sinon
      .stub(HoldingsTransactionDispatcher.prototype, 'dispatchHoldingsTransactionForDepositRequests')
      .resolves()
    const updateDepositRequestStub = sinon.stub(coreOperations, 'updateDepositRequest').resolves()

    await holdingsTransactionGateway.dispatchHoldingsTransactionForConfirmedDepositRequest(txId, CurrencyCode.bitcoin)

    expect(updateDepositRequestStub.calledWith(depositRequestId, { status: DepositRequestStatus.pendingHoldingsTransaction })).to.eql(true)
    expect(dispatchHoldingsTransactionForDepositRequestsStub.calledWith([{ id: depositRequestId } as any], CurrencyCode.bitcoin)).to.eql(true)
  })
})
