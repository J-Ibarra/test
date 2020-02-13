import { expect } from 'chai'
import Decimal from 'decimal.js'
import { get } from 'lodash'
import * as sinon from 'sinon'

import { EmailTemplates } from '@abx-types/notification'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequestStatus } from '@abx-types/deposit'
import * as DepositRequestRepo from '../../../../core'
import { DepositGatekeeper } from '../framework/deposit_gatekeeper'
import * as SuspendDepositRequestProcessor from '../framework/suspend_deposit_request_processor'
import { currencyToDepositRequests, depositRequest, testAccount, testBoundary, testUser } from './data.helper'
import { isFiatCurrency } from '@abx-service-clients/reference-data'
import * as notificationOperations from '@abx-service-clients/notification'
import * as accountOperations from '@abx-service-clients/account'
import * as referenceDataOperations from '@abx-service-clients/reference-data'

const operationsEmail = 'dummyOpsEmail'

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
      const { spyUpdateDepositRequest, stubCreateEmailRequest, getOperationsEmailStub } = prepareStub(depositRequest)

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
        to: operationsEmail,
        subject: 'Kinesis Money Deposit Success',
        templateName: EmailTemplates.DepositSuspendedEmail,
        templateContent,
      }

      expect(spyUpdateDepositRequest.getCalls().length).to.eql(1)
      expect(spyUpdateDepositRequest.calledWith(depositRequest.id!, { status: DepositRequestStatus.suspended })).to.eql(true)
      expect(stubCreateEmailRequest.calledWith(emailRequest))
      expect(pendingSuspendedDepositGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)!.length).to.eql(0)
      expect(checkingSuspendedDepositGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)![0].request).to.eql(depositRequest)
      expect(getOperationsEmailStub.calledOnce).to.eql(true)
    })
  })

  describe('processCheckingSuspendedDepositRequest', () => {
    it('should not execute any logic when not new request in pendingSuspendedDepositGatekeeper', async () => {
      sinon.stub(accountOperations, 'isAccountSuspended').resolves(false)
      const { spyUpdateDepositRequest } = prepareStub(depositRequest)

      checkingSuspendedDepositGatekeeper.addNewDepositsForCurrency(CurrencyCode.kau, [depositRequest])
      await SuspendDepositRequestProcessor.processCheckingSuspendedDepositRequest(
        checkingSuspendedDepositGatekeeper,
        pendingHoldingsTransferGatekeeper,
        CurrencyCode.kau,
      )

      expect(spyUpdateDepositRequest.getCalls().length).to.eql(1)
      expect(spyUpdateDepositRequest.calledWith(depositRequest.id!, { status: DepositRequestStatus.pendingHoldingsTransaction }))
      expect(checkingSuspendedDepositGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)!.length).to.eql(0)
      expect(pendingHoldingsTransferGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)![0].request).to.eql(depositRequest)
    })
  })
})

const prepareStub = request => {
  const spyUpdateDepositRequest = sinon.stub(DepositRequestRepo, 'updateDepositRequest').resolves(request)

  const stubUser = sinon.stub(accountOperations, 'findUserByAccountId').resolves(testUser)
  const stubAccount = sinon.stub(accountOperations, 'findAccountById').resolves(testAccount)
  const stubBoundaries = sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves(testBoundary)
  const stubCreateEmailRequest = sinon.stub(notificationOperations, 'createEmail').resolves()
  const getOperationsEmailStub = sinon.stub(referenceDataOperations, 'getOperationsEmail').resolves('dummyOpsEmail')

  return {
    spyUpdateDepositRequest,
    stubUser,
    stubAccount,
    stubBoundaries,
    stubCreateEmailRequest,
    getOperationsEmailStub,
  }
}
