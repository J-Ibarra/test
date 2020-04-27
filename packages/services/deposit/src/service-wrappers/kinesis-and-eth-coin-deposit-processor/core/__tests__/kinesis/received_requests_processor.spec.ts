import { expect } from 'chai'
import * as sinon from 'sinon'
import * as Account from '@abx-service-clients/account'
import * as Balance from '@abx-service-clients/balance'
import { CurrencyCode } from '@abx-types/reference-data'
import * as depositRequestOperations from '../../../../../core'
import { processReceivedDepositRequestForCurrency } from '../../kinesis'
import { currencyToDepositRequests, depositRequest, balanceAdjustment } from '../data.helper'
import { DepositGatekeeper } from '../../framework'

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

    expect(checkConfirmationOfTransactionStub.getCalls().length).to.eql(0)
  })

  it('should not check if account is suspended if deposit transaction is not confirmed and break cycle', async () => {
    receivedGateKeeper.addNewDepositsForCurrency(CurrencyCode.kau, [depositRequest])
    const checkConfirmationOfTransactionStub = sinon.stub().resolves(false)
    const currencyManager = getCurrencyManager(checkConfirmationOfTransactionStub)

    const isAccountSuspendedStub = sinon.stub(Account, 'isAccountSuspended')

    await triggerProcessor(currencyManager)

    expect(checkConfirmationOfTransactionStub.calledOnceWith(depositRequest.depositTxHash)).to.eql(true)
    expect(receivedGateKeeper[currencyToDepositRequests].get(CurrencyCode.kau)![0].isLocked).to.eql(false)
    expect(isAccountSuspendedStub.getCalls().length).to.eql(0)
  })

  it('should add account to suspended gatekeeper if account is suspended and break cycle', async () => {
    receivedGateKeeper.addNewDepositsForCurrency(CurrencyCode.kau, [depositRequest])
    const checkConfirmationOfTransactionStub = sinon.stub().resolves(true)
    const currencyManager = getCurrencyManager(checkConfirmationOfTransactionStub)

    const isAccountSuspendedStub = sinon.stub(Account, 'isAccountSuspended').resolves(true)

    await triggerProcessor(currencyManager)

    expect(checkConfirmationOfTransactionStub.calledOnceWith(depositRequest.depositTxHash)).to.eql(true)
    expect(isAccountSuspendedStub.getCalls().length).to.eql(1)
    expect(receivedGateKeeper[currencyToDepositRequests].get(CurrencyCode.kau).length).to.eql(0)
    expect(pendingSuspendedDepositGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau).length).to.eql(1)
  })

  it('should not complete deposit request if balance adjustment is already created and break cycle', async () => {
    receivedGateKeeper.addNewDepositsForCurrency(CurrencyCode.kau, [depositRequest])
    const checkConfirmationOfTransactionStub = sinon.stub().resolves(true)
    const currencyManager = getCurrencyManager(checkConfirmationOfTransactionStub)

    const isAccountSuspendedStub = sinon.stub(Account, 'isAccountSuspended').resolves(false)
    const getBalanceAdjustmentStub = sinon.stub(Balance, 'getBalanceAdjustmentForSourceEventId')
      .resolves(balanceAdjustment)
    const completeReceivedDepositStub = sinon.stub(depositRequestOperations, 'completeReceivedDeposit')

    await triggerProcessor(currencyManager)

    expect(checkConfirmationOfTransactionStub.calledOnceWith(depositRequest.depositTxHash)).to.eql(true)
    expect(isAccountSuspendedStub.getCalls().length).to.eql(1)
    expect(getBalanceAdjustmentStub.getCalls().length).to.eql(1)
    expect(completeReceivedDepositStub.getCalls().length).to.eql(0)
    expect(receivedGateKeeper[currencyToDepositRequests].get(CurrencyCode.kau).length).to.eql(0)
  })

  it('should complete deposit request if balance adjustment is not already created', async () => {
    receivedGateKeeper.addNewDepositsForCurrency(CurrencyCode.kau, [depositRequest])
    const checkConfirmationOfTransactionStub = sinon.stub().resolves(true)
    const currencyManager = getCurrencyManager(checkConfirmationOfTransactionStub)

    const isAccountSuspendedStub = sinon.stub(Account, 'isAccountSuspended').resolves(false)
    const getBalanceAdjustmentStub = sinon.stub(Balance, 'getBalanceAdjustmentForSourceEventId')
      .resolves(null)
    const completeReceivedDepositStub = sinon.stub(depositRequestOperations, 'completeReceivedDeposit')

    await triggerProcessor(currencyManager)

    expect(checkConfirmationOfTransactionStub.calledOnceWith(depositRequest.depositTxHash)).to.eql(true)
    expect(isAccountSuspendedStub.getCalls().length).to.eql(1)
    expect(getBalanceAdjustmentStub.getCalls().length).to.eql(1)
    expect(completeReceivedDepositStub.getCalls().length).to.eql(1)
    expect(completeReceivedDepositStub.getCalls()[0].args[0]).to.eql(depositRequest)

    expect(receivedGateKeeper[currencyToDepositRequests].get(CurrencyCode.kau).length).to.eql(0)
    expect(
      completedPendingHoldingsTransactionGatekeeper[currencyToDepositRequests]
        .get(CurrencyCode.kau).length
    ).to.eql(1)
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
