import { expect } from 'chai'
import request from 'supertest'
import sinon from 'sinon'
import { AdminRequestStatus, AdminRequestType } from '@abx-service-clients/admin-fund-management'
import { findAllAdminRequests, saveAdminRequest } from '../../core'
import { SourceEventType } from '@abx-types/balance'
import { getEpicurusInstance, truncateTables } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { bootstrapRestApi } from '..'
import { WithdrawalPubSubChannels } from '@abx-service-clients/withdrawal'
import { createTemporaryTestingAccount, createAccountAndSession } from '@abx-utils/account'
import { AccountType } from '@abx-types/account'
import * as accountServiceOperations from '@abx-service-clients/account'
import * as balanceOperations from '@abx-service-clients/balance'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import * as withdrawalOperations from '@abx-service-clients/withdrawal'
import * as expressMiddleware from '@abx/express-middleware'

import Decimal from 'decimal.js'

const usdId = 5
const kauId = 2
const revenueAccountId = 'adasd-5'

describe.skip('api:admin_request:rejection', () => {
  let app: ReturnType<typeof bootstrapRestApi>

  beforeEach(async () => {
    await truncateTables()
    app = bootstrapRestApi()
    sinon.stub(accountServiceOperations, 'findOrCreateKinesisRevenueAccount').resolves({ id: revenueAccountId })
    sinon
      .stub(referenceDataOperations, 'getCurrencyId')
      .withArgs(CurrencyCode.usd)
      .resolves(usdId)
      .withArgs(CurrencyCode.kau)
      .resolves(kauId)
  })

  afterEach(async () => {
    sinon.restore()
    await app.close()
  })

  it('should reject withdrawal and return reserved balance into available balance', async () => {
    const testClient = await createTemporaryTestingAccount()
    const pendingWithdrawalAmount = 1000
    const fee = 25

    sinon.stub(accountServiceOperations, 'findAccountWithUserDetails').resolves(testClient)

    const { account: adminAccount, cookie } = await createAccountAndSession(AccountType.admin)

    const adminRequest = await saveAdminRequest({
      client: testClient.users![0].firstName!,
      asset: CurrencyCode.usd,
      amount: pendingWithdrawalAmount,
      description: 'foo',
      fee,
      hin: testClient.hin!,
      type: AdminRequestType.withdrawal,
      admin: adminAccount.id,
      status: AdminRequestStatus.pending,
    })

    const epicurus = getEpicurusInstance()
    let withdrawalRequestUpdateEvent
    epicurus.subscribe(WithdrawalPubSubChannels.withdrawalRequestUpdated, params => (withdrawalRequestUpdateEvent = params))

    const updatedAtDate = new Date()
    const cancelFiatWithdrawalStub = sinon.stub(withdrawalOperations, 'cancelFiatWithdrawal').resolves()
    sinon.stub(expressMiddleware, 'overloadRequestWithSessionInfo').callsFake(async (request, _, next: () => void = () => ({})) => {
      request.account = adminAccount
      next()
    })

    const { status: getStatus } = await request(app)
      .patch(`/api/admin/fund-management/admin-requests/${adminRequest.id}`)
      .send({ status: AdminRequestStatus.rejected, updatedAt: updatedAtDate })
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(getStatus).to.eql(200)

    const adminRequests = await findAllAdminRequests()
    expect(adminRequests[0].status).to.eql(AdminRequestStatus.rejected)

    expect(withdrawalRequestUpdateEvent).to.eql({
      channel: WithdrawalPubSubChannels.withdrawalRequestUpdated,
      globalTransactionId: adminRequest.globalTransactionId,
      description: adminRequest.description,
      paymentStatus: 'Forfeited',
      updatedAt: updatedAtDate.toISOString(),
      tradingPlatformName: adminRequest.tradingPlatformName,
    })

    expect(cancelFiatWithdrawalStub.calledWith(adminRequests[0].id))
  })

  it('should reject redemption admin request for account and return pendingRedemption amount back to available', async () => {
    const testClient = await createTemporaryTestingAccount()
    const redemptionAmount = 90
    const fee = 12

    const { account: adminAccount, cookie } = await createAccountAndSession(AccountType.admin)

    sinon.stub(accountServiceOperations, 'findAccountWithUserDetails').resolves(testClient)

    const denyPendingRedemptionStub = sinon.stub(balanceOperations, 'denyPendingRedemption').resolves()

    const adminRequest = await saveAdminRequest({
      client: testClient.users![0].firstName!,
      hin: testClient.hin!,
      type: AdminRequestType.redemption,
      asset: CurrencyCode.kau,
      amount: redemptionAmount,
      description: 'foo',
      fee,
      admin: adminAccount.id,
      status: AdminRequestStatus.pending,
    })
    sinon.stub(expressMiddleware, 'overloadRequestWithSessionInfo').callsFake(async (request, _, next: () => void = () => ({})) => {
      request.account = adminAccount
      next()
    })

    const { status: getStatus } = await request(app)
      .patch(`/api/admin/fund-management/admin-requests/${adminRequest.id}`)
      .send({ status: AdminRequestStatus.rejected, updatedAt: new Date() })
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(getStatus).to.eql(200)
    expect(
      denyPendingRedemptionStub.calledWith({
        sourceEventType: SourceEventType.adminRequest,
        sourceEventId: adminRequest.id,
        currencyId: kauId,
        accountId: testClient.id,
        amount: new Decimal(adminRequest.amount).add(adminRequest.fee!).toNumber(),
      }),
    )
  })

  it('should reject deposit and not change available balance', async () => {
    const testClient = await createTemporaryTestingAccount()
    const pendingDepositAmount = 1000

    const { account: adminAccount, cookie } = await createAccountAndSession(AccountType.admin)
    const adminRequest = await saveAdminRequest({
      client: testClient.users![0].firstName!,
      asset: CurrencyCode.usd,
      amount: pendingDepositAmount,
      hin: testClient.hin!,
      type: AdminRequestType.deposit,
      admin: adminAccount.id,
      description: 'foo',
      fee: 0,
      status: AdminRequestStatus.pending,
    })

    const denyPendingDepositStub = sinon.stub(balanceOperations, 'denyPendingDeposit').resolves()

    sinon.stub(accountServiceOperations, 'findAccountWithUserDetails').resolves(testClient)
    sinon.stub(expressMiddleware, 'overloadRequestWithSessionInfo').callsFake(async (request, _, next: () => void = () => ({})) => {
      request.account = adminAccount
      next()
    })

    const { status: getStatus } = await request(app)
      .patch(`/api/admin/fund-management/admin-requests/${adminRequest.id}`)
      .send({ status: AdminRequestStatus.rejected, updatedAt: new Date() })
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(getStatus).to.eql(200)

    const adminRequests = await findAllAdminRequests()
    expect(adminRequests[0].status).to.eql(AdminRequestStatus.rejected)

    expect(
      denyPendingDepositStub.calledWith({
        sourceEventType: SourceEventType.adminRequest,
        sourceEventId: adminRequest.id,
        currencyId: usdId,
        accountId: testClient.id,
        amount: adminRequest.amount,
      }),
    ).to.eql(true)
  })
})
