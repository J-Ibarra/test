import { expect } from 'chai'
import * as sinon from 'sinon'

import { CurrencyCode } from '@abx-types/reference-data'
import * as completionOperations from '../../../../core'
import { processCompletionPendingDepositRequestForCurrency } from '../framework/completion_pending_requests_processor'
import { currencyToDepositRequests, depositRequest } from './data.helper'
import { DepositGatekeeper } from '../framework'

const holdingsTxHash = 'holdings-tx-hash'

const completionPendingRequest = { ...depositRequest, holdingsTxHash }

describe('completion_pending_request_processor', () => {
  let pendingCompletionGatekeeper: DepositGatekeeper

  beforeEach(async () => {
    pendingCompletionGatekeeper = new DepositGatekeeper('pendingCompletionGatekeeper')
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should not execute any logic when no new requests in pendingCompletionGateKeeper', async () => {
    const checkConfirmationOfTransactionSpy = sinon.spy()

    const currencyGateway = {
      getCurrencyFromTicker: () => ({
        checkConfirmationOfTransaction: checkConfirmationOfTransactionSpy,
      }),
    }

    await processCompletionPendingDepositRequestForCurrency(pendingCompletionGatekeeper, CurrencyCode.kau, currencyGateway as any)

    expect(checkConfirmationOfTransactionSpy.getCalls().length).to.eql(0)
  })

  it('should not transfer amount if holdings transaction no confirmed', async () => {
    const { currencyGateway, checkConfirmationOfTransactionSpy } = stubConfirmationCheck(pendingCompletionGatekeeper, false)

    const completePendingDepositStub = sinon.stub(completionOperations, 'completePendingDeposit')

    await processCompletionPendingDepositRequestForCurrency(pendingCompletionGatekeeper, CurrencyCode.kau, currencyGateway as any)

    expect(checkConfirmationOfTransactionSpy.calledOnceWith(completionPendingRequest.holdingsTxHash)).to.eql(true)
    expect(pendingCompletionGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)![0].isLocked).to.eql(false)
    expect(completePendingDepositStub.getCalls().length).to.eql(0)
  })

  it('should call complete pending deposit if holdings transaction confirmed and remove request from pendingCompletionGatekeeper', async () => {
    const { currencyGateway, checkConfirmationOfTransactionSpy } = stubConfirmationCheck(pendingCompletionGatekeeper)

    const completePendingDepositStub = sinon.stub(completionOperations, 'completePendingDeposit')

    await processCompletionPendingDepositRequestForCurrency(pendingCompletionGatekeeper, CurrencyCode.kau, currencyGateway as any)

    expect(checkConfirmationOfTransactionSpy.calledOnceWith(completionPendingRequest.holdingsTxHash)).to.eql(true)
    expect(pendingCompletionGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)!.length).to.eql(0)
    expect(completePendingDepositStub.getCall(0).args[0]).to.eql(completionPendingRequest)
  })

  it('should unlock request in pendingCompletionGatekeeper for another attempt if completePendingDeposit fails', async () => {
    const { currencyGateway, checkConfirmationOfTransactionSpy } = stubConfirmationCheck(pendingCompletionGatekeeper)
    const completePendingDepositStub = sinon.stub(completionOperations, 'completePendingDeposit').rejects('Failure')

    await processCompletionPendingDepositRequestForCurrency(pendingCompletionGatekeeper, CurrencyCode.kau, currencyGateway as any)

    expect(checkConfirmationOfTransactionSpy.calledOnceWith(completionPendingRequest.holdingsTxHash)).to.eql(true)
    expect(pendingCompletionGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)![0].isLocked).to.eql(false)
    expect(completePendingDepositStub.getCall(0).args[0]).to.eql(completionPendingRequest)
  })
})

const stubConfirmationCheck = (pendingCompletionGatekeeper, confirmationResult = true) => {
  pendingCompletionGatekeeper.addNewDepositsForCurrency(CurrencyCode.kau, [completionPendingRequest])
  const checkConfirmationOfTransactionSpy = sinon.mock().resolves(confirmationResult)

  const currencyGateway = {
    getCurrencyFromTicker: () => ({
      checkConfirmationOfTransaction: checkConfirmationOfTransactionSpy,
    }),
  }

  return {
    currencyGateway,
    checkConfirmationOfTransactionSpy,
  }
}