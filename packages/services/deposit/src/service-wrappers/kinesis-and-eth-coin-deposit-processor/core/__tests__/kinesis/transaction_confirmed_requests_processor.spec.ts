import { expect } from 'chai'
import * as sinon from 'sinon'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequestStatus } from '@abx-types/deposit'
import * as depositRequestOperations from '../../../../../core'
import { processTransactionConfirmedDepositRequestsForCurrency } from '../../'
import { currencyToDepositRequests, depositRequest } from '../data.helper'
import { DepositGatekeeper } from '../../framework'

describe('transaction_confirmed_requests_processor', () => {
  let pendingHoldingsTransactionConfirmationGatekeeper: DepositGatekeeper

  beforeEach(async () => {
    pendingHoldingsTransactionConfirmationGatekeeper = new DepositGatekeeper('pendingHoldingsTransactionConfirmationGatekeeper')
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should not execute any logic when no new requests in pendingHoldingsTransactionConfirmationGatekeeper', async () => {
    const checkConfirmationOfTransactionStub = sinon.stub()
    const currencyManager = getCurrencyManager(checkConfirmationOfTransactionStub)

    await triggerProcessor(currencyManager)

    expect(checkConfirmationOfTransactionStub.notCalled).to.eql(true)
  })

  it('should not complete request if deposit transaction is not confirmed and break cycle', async () => {
    pendingHoldingsTransactionConfirmationGatekeeper.addNewDepositsForCurrency(CurrencyCode.kau, [depositRequest])
    const checkConfirmationOfTransactionStub = sinon.stub().resolves(false)
    const currencyManager = getCurrencyManager(checkConfirmationOfTransactionStub)

    await triggerProcessor(currencyManager)

    expect(checkConfirmationOfTransactionStub.calledOnceWith(depositRequest.depositTxHash)).to.eql(true)
    expect(pendingHoldingsTransactionConfirmationGatekeeper[currencyToDepositRequests]!.get(CurrencyCode.kau)![0].isLocked).to.eql(false)
  })

  it('should complete deposit request if balance adjustment is not already created', async () => {
    pendingHoldingsTransactionConfirmationGatekeeper.addNewDepositsForCurrency(CurrencyCode.kau, [depositRequest])
    const checkConfirmationOfTransactionStub = sinon.stub().resolves(true)
    const currencyManager = getCurrencyManager(checkConfirmationOfTransactionStub)

    const updateDepositRequestStub = sinon.stub(depositRequestOperations, 'updateDepositRequest')

    await triggerProcessor(currencyManager)

    expect(checkConfirmationOfTransactionStub.calledOnceWith(depositRequest.depositTxHash)).to.eql(true)
    expect(
      updateDepositRequestStub.calledOnceWith(depositRequest.id!, {
        status: DepositRequestStatus.completed,
      }),
    ).to.eql(true)
    expect(pendingHoldingsTransactionConfirmationGatekeeper[currencyToDepositRequests]!.get(CurrencyCode.kau)!.length).to.eql(0)
  })

  async function triggerProcessor(currencyManager) {
    await processTransactionConfirmedDepositRequestsForCurrency(
      pendingHoldingsTransactionConfirmationGatekeeper,
      CurrencyCode.kau,
      currencyManager as any,
    )
  }

  function getCurrencyManager(checkConfirmationOfTransactionStub) {
    return {
      getCurrencyFromTicker: () => ({
        checkConfirmationOfTransaction: checkConfirmationOfTransactionStub,
      }),
    }
  }
})
