import { expect } from 'chai'
import * as sinon from 'sinon'
import * as Account from '@abx-service-clients/account'
import { CurrencyCode } from '@abx-types/reference-data'
import * as depositRequestOperations from '../../../../../core'
import { processReceivedDepositRequestForCurrency } from '../../kinesis'
import { currencyToDepositRequests, depositRequest, balanceAdjustment } from '../data.helper'
import { DepositGatekeeper } from '../../common'

describe('received_requests_processor', () => {
  let receivedGateKeeper: DepositGatekeeper
  let completedPendingHoldingsTransactionGatekeeper: DepositGatekeeper
  let pendingSuspendedDepositGatekeeper: DepositGatekeeper

  beforeEach(async () => {
    receivedGateKeeper = new DepositGatekeeper('receivedGateKeeper')
    completedPendingHoldingsTransactionGatekeeper = new DepositGatekeeper('completedPendingHoldingsTransactionGatekeeper')
    pendingSuspendedDepositGatekeeper = new DepositGatekeeper('pendingSuspendedDepositGatekeeper')
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should not execute any logic when no new requests in receivedGateKeeper', async () => {
    const checkConfirmationOfTransactionStub = sinon.stub()
    const currencyManager = getCurrencyManager(checkConfirmationOfTransactionStub)

    await triggerProcessor(currencyManager)

    expect(checkConfirmationOfTransactionStub.notCalled).to.eql(true)
  })

  it('should not check if account is suspended if deposit transaction is not confirmed and break cycle', async () => {
    receivedGateKeeper.addNewDepositsForCurrency(CurrencyCode.kau, [depositRequest])
    const checkConfirmationOfTransactionStub = sinon.stub().resolves(false)
    const currencyManager = getCurrencyManager(checkConfirmationOfTransactionStub)

    const isAccountSuspendedStub = sinon.stub(Account, 'isAccountSuspended')

    await triggerProcessor(currencyManager)

    expect(checkConfirmationOfTransactionStub.calledOnceWith(depositRequest.depositTxHash)).to.eql(true)
    expect(receivedGateKeeper[currencyToDepositRequests]!.get(CurrencyCode.kau)![0].isLocked).to.eql(false)
    expect(isAccountSuspendedStub.notCalled).to.eql(true)
  })

  it('should add account to suspended gatekeeper if account is suspended and break cycle', async () => {
    receivedGateKeeper.addNewDepositsForCurrency(CurrencyCode.kau, [depositRequest])
    const checkConfirmationOfTransactionStub = sinon.stub().resolves(true)
    const currencyManager = getCurrencyManager(checkConfirmationOfTransactionStub)

    const isAccountSuspendedStub = sinon.stub(Account, 'isAccountSuspended').resolves(true)

    await triggerProcessor(currencyManager)

    expect(checkConfirmationOfTransactionStub.calledOnceWith(depositRequest.depositTxHash)).to.eql(true)
    expect(isAccountSuspendedStub.calledOnce).to.eql(true)
    expect(receivedGateKeeper[currencyToDepositRequests]!.get(CurrencyCode.kau)!.length).to.eql(0)
    expect(pendingSuspendedDepositGatekeeper[currencyToDepositRequests]!.get(CurrencyCode.kau)!.length).to.eql(1)
  })

  it('should not complete deposit request if balance adjustment is already created and break cycle', async () => {
    receivedGateKeeper.addNewDepositsForCurrency(CurrencyCode.kau, [depositRequest])
    const checkConfirmationOfTransactionStub = sinon.stub().resolves(true)
    const currencyManager = getCurrencyManager(checkConfirmationOfTransactionStub)

    const isAccountSuspendedStub = sinon.stub(Account, 'isAccountSuspended').resolves(false)
    const completeReceivedDepositStub = sinon.stub(depositRequestOperations, 'completeReceivedDeposit')

    await triggerProcessor(currencyManager)

    expect(checkConfirmationOfTransactionStub.calledOnceWith(depositRequest.depositTxHash)).to.eql(true)
    expect(isAccountSuspendedStub.calledOnce).to.eql(true)
    expect(completeReceivedDepositStub.notCalled).to.eql(true)
    expect(receivedGateKeeper[currencyToDepositRequests]!.get(CurrencyCode.kau)!.length).to.eql(0)
  })

  it('should complete deposit request if balance adjustment is not already created', async () => {
    receivedGateKeeper.addNewDepositsForCurrency(CurrencyCode.kau, [depositRequest])
    const checkConfirmationOfTransactionStub = sinon.stub().resolves(true)
    const currencyManager = getCurrencyManager(checkConfirmationOfTransactionStub)

    const isAccountSuspendedStub = sinon.stub(Account, 'isAccountSuspended').resolves(false)
    const completeReceivedDepositStub = sinon.stub(depositRequestOperations, 'completeReceivedDeposit')

    await triggerProcessor(currencyManager)

    expect(checkConfirmationOfTransactionStub.calledOnceWith(depositRequest.depositTxHash)).to.eql(true)
    expect(isAccountSuspendedStub.calledOnce).to.eql(true)
    expect(completeReceivedDepositStub.calledOnce).to.eql(true)
    expect(completeReceivedDepositStub.getCall(0).args[0]).to.eql(depositRequest)

    expect(receivedGateKeeper[currencyToDepositRequests]!.get(CurrencyCode.kau)!.length).to.eql(0)
    expect(completedPendingHoldingsTransactionGatekeeper[currencyToDepositRequests]!.get(CurrencyCode.kau)!.length).to.eql(1)
  })

  async function triggerProcessor(currencyGateway) {
    await processReceivedDepositRequestForCurrency(
      receivedGateKeeper,
      completedPendingHoldingsTransactionGatekeeper,
      pendingSuspendedDepositGatekeeper,
      CurrencyCode.kau,
      currencyGateway as any,
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
