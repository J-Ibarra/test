import sinon from 'sinon'
import { expect } from 'chai'
import * as coreOperations from '../../../../../core'
import { HoldingsTransactionGateway } from '../../holdings-transaction-creation/HoldingsTransactionGateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequestStatus } from '@abx-types/deposit'
import { HoldingsTransactionDispatcher, DepositCompleter } from '../../../../../core'

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

  it('should update deposit request in pendingHoldingsTransaction and dispatch transaction', async () => {
    const depositRequestId = 1
    const depositRequest = {
      id: depositRequestId
    }
    sinon.stub(coreOperations, 'findDepositRequestByDepositTransactionHash').resolves(depositRequest)
    sinon.stub(coreOperations, 'findDepositRequestsForStatuses').resolves([])

    const dispatchHoldingsTransactionForDepositRequestsStub = sinon
      .stub(HoldingsTransactionDispatcher.prototype, 'dispatchHoldingsTransactionForDepositRequests')
      .resolves([depositRequest])
    const depositCompleterStub = sinon.stub(DepositCompleter.prototype, 'completeDepositRequests').resolves()
    const updateDepositRequestStub = sinon.stub(coreOperations, 'updateDepositRequest').resolves()

    await holdingsTransactionGateway.dispatchHoldingsTransactionForConfirmedDepositRequest(txId, CurrencyCode.bitcoin)

    expect(updateDepositRequestStub.calledWith(depositRequestId, { status: DepositRequestStatus.pendingHoldingsTransaction })).to.eql(true)
    expect(dispatchHoldingsTransactionForDepositRequestsStub.calledWith([depositRequest as any], CurrencyCode.bitcoin)).to.eql(true)
    expect(depositCompleterStub.calledWith([depositRequest as any], CurrencyCode.bitcoin, DepositRequestStatus.pendingHoldingsTransactionConfirmation)).to.eql(true)
  })

  it('should update deposit request to blockedForHoldingsTransactionConfirmation when an UTXO error occurs while trying to send transaction', async () => {
    const depositRequestId = 1
    sinon.stub(coreOperations, 'findDepositRequestByDepositTransactionHash').resolves({
      id: depositRequestId,
    })
    sinon.stub(coreOperations, 'findDepositRequestsForStatuses').resolves([])

    const dispatchHoldingsTransactionForDepositRequestsStub = sinon
      .stub(HoldingsTransactionDispatcher.prototype, 'dispatchHoldingsTransactionForDepositRequests')
      .throws({
        meta: {
          error: {
            code: HoldingsTransactionGateway.BTC_INSUFFICIENT_UTXO_ERROR_CODE,
          },
        },
      })
    const depositCompleterStub = sinon.stub(DepositCompleter.prototype, 'completeDepositRequests').resolves()
    const updateDepositRequestStub = sinon.stub(coreOperations, 'updateDepositRequest').resolves()

    await holdingsTransactionGateway.dispatchHoldingsTransactionForConfirmedDepositRequest(txId, CurrencyCode.bitcoin)

    expect(updateDepositRequestStub.calledWith(depositRequestId, { status: DepositRequestStatus.pendingHoldingsTransaction })).to.eql(true)
    expect(dispatchHoldingsTransactionForDepositRequestsStub.calledWith([{ id: depositRequestId } as any], CurrencyCode.bitcoin)).to.eql(true)
    expect(updateDepositRequestStub.calledWith(depositRequestId, { status: DepositRequestStatus.blockedForHoldingsTransactionConfirmation })).to.eql(
      true,
    )
    expect(depositCompleterStub.notCalled).to.eql(true)
  })
})
