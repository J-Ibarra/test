import { expect } from 'chai'
import request from 'supertest'
import { AccountType } from '@abx-types/account'
import { AdminRequestType } from '@abx-service-clients/admin-fund-management'
import { findAllAdminRequests } from '../../core'
import { CurrencyCode } from '@abx-types/reference-data'
import { bootstrapRestApi } from '..'
import { createTemporaryTestingAccount, createAccountAndSession } from '@abx-query-libs/account'
import sinon from 'sinon'
import * as accountServiceOperations from '@abx-service-clients/account'
import * as balanceOperations from '@abx-service-clients/balance'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import * as withdrawalOperations from '@abx-service-clients/withdrawal'
import * as expressMiddleware from '@abx/express-middleware'

import { SourceEventType } from '@abx-types/balance'
import Decimal from 'decimal.js'
import { truncateTables } from '@abx-utils/db-connection-utils'

const usdId = 5
const kauId = 2

describe('api:admin_request:create', () => {
  let app: ReturnType<typeof bootstrapRestApi>

  beforeEach(async () => {
    await truncateTables()
    app = bootstrapRestApi()
  })

  afterEach(async () => {
    sinon.restore()
    await app.close()
  })

  describe('redemption', () => {
    it('should create redemption admin request for account when available balance enough', async () => {
      const testClient = await createTemporaryTestingAccount()
      const redemptionAmount = 100
      const fee = 1

      const { account: adminAccount, cookie } = await createAccountAndSession(AccountType.admin)

      sinon.stub(referenceDataOperations, 'getCurrencyId').resolves(kauId)
      sinon.stub(accountServiceOperations, 'findAccountWithUserDetails').resolves(testClient)
      sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves({ maxDecimals: 5 })
      const createPendingRedemptionStub = sinon.stub(balanceOperations, 'createPendingRedemption').resolves()
      sinon.stub(expressMiddleware, 'overloadRequestWithSessionInfo').callsFake(async (request, _, next: () => void = () => ({})) => {
        request.account = adminAccount
        next()
      })

      const { status: getStatus, body } = await request(app)
        .post(`/api/admin/fund-management/admin-requests`)
        .send({
          hin: testClient.hin,
          amount: redemptionAmount,
          asset: CurrencyCode.kau,
          fee,
          type: AdminRequestType.redemption,
          description: 'foo',
        })
        .set('Cookie', cookie)
        .set('Accept', 'application/json')

      const adminRequests = await findAllAdminRequests()
      expect(getStatus).to.eql(200)
      expect(adminRequests.length).to.eql(1)
      expect(body.type).to.eql(AdminRequestType.redemption)
      expect(body.amount).to.eql(redemptionAmount)
      expect(body.fee).to.eql(fee)

      expect(
        createPendingRedemptionStub.calledWith({
          sourceEventType: SourceEventType.adminRequest,
          sourceEventId: adminRequests[0].id,
          currencyId: kauId,
          accountId: testClient.id,
          amount: new Decimal(redemptionAmount)
            .plus(fee)
            .toDecimalPlaces(5)
            .toNumber(),
        }),
      ).to.eql(true)
    })
  })

  describe('withdrawal', () => {
    it('should create withdrawal admin request for account', async () => {
      const testClient = await createTemporaryTestingAccount()
      const withdrawalAmount = 90
      const feeAmount = 25

      const { account: adminAccount, cookie } = await createAccountAndSession(AccountType.admin)

      sinon.stub(referenceDataOperations, 'getCurrencyId').resolves(usdId)
      sinon.stub(accountServiceOperations, 'findAccountWithUserDetails').resolves(testClient)
      sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves({ maxDecimals: 2 })

      const createFiatWithdrawalStub = sinon.stub(withdrawalOperations, 'createFiatWithdrawal').resolves()

      sinon.stub(expressMiddleware, 'overloadRequestWithSessionInfo').callsFake(async (request, _, next: () => void = () => ({})) => {
        request.account = adminAccount
        next()
      })

      const { status: getStatus, body } = await request(app)
        .post(`/api/admin/fund-management/admin-requests`)
        .send({
          hin: testClient.hin,
          amount: withdrawalAmount,
          asset: CurrencyCode.usd,
          fee: feeAmount,
          type: AdminRequestType.withdrawal,
          description: 'foo',
        })
        .set('Cookie', cookie)
        .set('Accept', 'application/json')

      expect(getStatus).to.eql(200)
      expect(body.type).to.eql(AdminRequestType.withdrawal)
      expect(body.amount).to.eql(withdrawalAmount)
      expect(body.fee).to.eql(feeAmount)

      const adminRequests = await findAllAdminRequests()
      expect(adminRequests.length).to.eql(1)
      const withdrawalAdminRequest = adminRequests[0]

      expect(
        createFiatWithdrawalStub.calledWith({
          amount: withdrawalAdminRequest.amount,
          accountId: testClient.id,
          memo: withdrawalAdminRequest.description!,
          currencyCode: withdrawalAdminRequest.asset,
          transactionId: withdrawalAdminRequest.globalTransactionId,
          transactionFee: withdrawalAdminRequest.fee!,
          adminRequestId: withdrawalAdminRequest.id,
          createdAt: withdrawalAdminRequest.createdAt,
        }),
      ).to.eql(true)
    })
  })

  it('should create deposit admin request for account', async () => {
    const testClient = await createTemporaryTestingAccount()
    const depositAmount = 10

    const { account: adminAccount, cookie } = await createAccountAndSession(AccountType.admin)

    sinon.stub(referenceDataOperations, 'getCurrencyId').resolves(usdId)
    sinon.stub(accountServiceOperations, 'findAccountWithUserDetails').resolves(testClient)
    sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves({ maxDecimals: 2 })

    const createPendingDepositStub = sinon.stub(balanceOperations, 'createPendingDeposit').resolves()

    sinon.stub(expressMiddleware, 'overloadRequestWithSessionInfo').callsFake(async (request, _, next: () => void = () => ({})) => {
      request.account = adminAccount
      next()
    })

    const { status: getStatus, body } = await request(app)
      .post(`/api/admin/fund-management/admin-requests`)
      .send({
        hin: testClient.hin,
        amount: depositAmount,
        asset: CurrencyCode.usd,
        fee: 0,
        type: AdminRequestType.deposit,
        description: 'foo',
      })
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    const adminRequests = await findAllAdminRequests()
    expect(getStatus).to.eql(200)
    expect(body.type).to.eql(AdminRequestType.deposit)
    expect(body.amount).to.eql(depositAmount)
    expect(body.fee).to.eql(0)
    expect(adminRequests.length).to.eql(1)

    const depositAdminRequest = adminRequests[0]

    expect(
      createPendingDepositStub.calledWith({
        sourceEventType: SourceEventType.adminRequest,
        sourceEventId: depositAdminRequest.id,
        currencyId: usdId,
        accountId: testClient.id,
        amount: new Decimal(depositAdminRequest.amount)
          .plus(depositAdminRequest.fee!)
          .toDecimalPlaces(2)
          .toNumber(),
      }),
    )
  }).timeout(60_000)
})
