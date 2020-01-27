import { expect } from 'chai'
import Decimal from 'decimal.js'
import { get } from 'lodash'
import * as sinon from 'sinon'

import * as Accounts from '../../../accounts'
import * as User from '../../../accounts/lib/users'
import * as Boundaries from '../../../boundaries'
import { EpicurusRequestChannel } from '../../../commons'
import * as epicurus from '../../../db/epicurus'
import { EmailTemplates } from '../../../notification/interfaces'
import { CurrencyCode, isFiatCurrency } from '../../../symbols'
import { DepositRequestStatus } from '../../interfaces'
import * as DepositRequestRepo from '../../lib/deposit_request'
import { DepositGatekeeper } from '../framework/deposit_gatekeeper'
import * as SuspendDepositRequestProcessor from '../framework/suspend_deposit_request_processor'
import { currencyToDepositRequests, depositRequest, testAccount, testBoundary, testUser } from './data.helper'

describe('suspended_deposit_request_processor', () => {
  let pendingSuspendedDepositGatekeeper: DepositGatekeeper
  let checkingSuspendedDepositGatekeeper: DepositGatekeeper
  let pendingHoldingsTransferGatekeeper: DepositGatekeeper

  beforeEach(async () => {
    pendingHoldingsTransferGatekeeper = new DepositGatekeeper('pendingHoldingsTransferGatekeeper')
    checkingSuspendedDepositGatekeeper = new DepositGatekeeper('checkingSuspendedDepositGatekeeper')
    pendingSuspendedDepositGatekeeper = new DepositGatekeeper('pendingSuspendedDepositGatekeeper')
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('processSuspendedDepositRequestForCurrency', () => {
    it('should not execute any logic when not new request in pendingSuspendedDepositGatekeeper', async () => {
      const { spyUpdateDepositRequest } = prepareStub(depositRequest)

      await SuspendDepositRequestProcessor.processSuspendedDepositRequestForCurrency(
        pendingSuspendedDepositGatekeeper,
        checkingSuspendedDepositGatekeeper,
        CurrencyCode.kau,
      )

      expect(spyUpdateDepositRequest.getCalls().length).to.eql(0)
    })

    it('should update the request status, send email, and add request to checkingSuspendedDepositGatekeeper', async () => {
      const { spyUpdateDepositRequest, stubEpicurusRequest } = prepareStub(depositRequest)

      pendingSuspendedDepositGatekeeper.addNewDepositsForCurrency(CurrencyCode.kau, [depositRequest])

      await SuspendDepositRequestProcessor.processSuspendedDepositRequestForCurrency(
        pendingSuspendedDepositGatekeeper,
        checkingSuspendedDepositGatekeeper,
        CurrencyCode.kau,
      )

      const templateContent = {
        email: testUser.email,
        hin: testAccount.hin,
        globalID: '',
        transactionHash: depositRequest.depositTxHash,
        depositAmount: new Decimal(depositRequest.amount).toFixed(get(testBoundary, 'maxDecimals', 0)),
        currencySymbol: isFiatCurrency(CurrencyCode.kau) ? '' : CurrencyCode.kau,
        depositAddress: depositRequest.depositAddress.publicKey,
      }

      const emailRequest = {
        to: Accounts.operationsEmail,
        subject: 'Kinesis Money Deposit Success',
        templateName: EmailTemplates.DepositSuspendedEmail,
        templateContent,
      }

      expect(spyUpdateDepositRequest.getCalls().length).to.eql(1)
      expect(spyUpdateDepositRequest.calledWith(depositRequest.id, { status: DepositRequestStatus.suspended }))
      expect(stubEpicurusRequest.getCalls().length).to.eql(1)
      expect(stubEpicurusRequest.calledWith(EpicurusRequestChannel.createEmail, emailRequest))
      expect(pendingSuspendedDepositGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau).length).to.eql(0)
      expect(checkingSuspendedDepositGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)[0].request).to.eql(depositRequest)
    })
  })

  describe('processCheckingSuspendedDepositRequest', () => {
    it('should not execute any logic when not new request in pendingSuspendedDepositGatekeeper', async () => {
      sinon.stub(Accounts, 'hasAccountSuspended').resolves(false)
      const { spyUpdateDepositRequest } = prepareStub(depositRequest)

      checkingSuspendedDepositGatekeeper.addNewDepositsForCurrency(CurrencyCode.kau, [depositRequest])
      await SuspendDepositRequestProcessor.processCheckingSuspendedDepositRequest(
        checkingSuspendedDepositGatekeeper,
        pendingHoldingsTransferGatekeeper,
        CurrencyCode.kau,
      )

      expect(spyUpdateDepositRequest.getCalls().length).to.eql(1)
      expect(spyUpdateDepositRequest.calledWith(depositRequest.id, { status: DepositRequestStatus.pendingHoldingsTransaction }))
      expect(checkingSuspendedDepositGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau).length).to.eql(0)
      expect(pendingHoldingsTransferGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)[0].request).to.eql(depositRequest)
    })
  })
})

const prepareStub = request => {
  const spyUpdateDepositRequest = sinon.stub(DepositRequestRepo, 'updateDepositRequest').resolves(request)

  const stubUser = sinon.stub(User, 'findUserByAccountId').resolves(testUser)
  const stubAccount = sinon.stub(Accounts, 'findAccountById').resolves(testAccount)
  const stubBoundaries = sinon.stub(Boundaries, 'findBoundaryForCurrency').resolves(testBoundary)
  const stubEpicurusRequest = sinon.stub().resolves()
  sinon.stub(epicurus, 'getInstance').returns({ request: stubEpicurusRequest } as any)
  return {
    spyUpdateDepositRequest,
    stubUser,
    stubAccount,
    stubBoundaries,
    stubEpicurusRequest,
  }
}
