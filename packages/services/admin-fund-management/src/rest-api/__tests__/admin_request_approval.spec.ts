import { expect } from 'chai'
import request from 'supertest'
import sinon from 'sinon'
import { AdminRequestStatus, AdminRequestType } from '@abx-service-clients/admin-fund-management'
import { findAllAdminRequests, saveAdminRequest } from '../../core'
import { SourceEventType } from '@abx-types/balance'
import { getEpicurusInstance, truncateTables } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { TransactionDirection } from '@abx-types/order'
import * as withdrawalOperations from '@abx-service-clients/withdrawal'
import { bootstrapRestApi, ADMIN_FUND_MANAGEMENT_REST_API_PORT } from '..'
import { WithdrawalPubSubChannels } from '@abx-service-clients/withdrawal'
import { createTemporaryTestingAccount, createAccountAndSession } from '@abx-utils/account'
import { AccountType } from '@abx-types/account'
import * as accountServiceOperations from '@abx-service-clients/account'
import * as balanceOperations from '@abx-service-clients/balance'
import * as blockGatewayOperations from '@abx-utils/blockchain-currency-gateway'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import * as orderOperations from '@abx-service-clients/order'
import * as expressMiddleware from '@abx/express-middleware'

import Decimal from 'decimal.js'

const usdId = 5
const kauId = 2
const revenueAccountId = 'adasd-5'

describe.skip('api:admin_request:approval', () => {
  let app
  beforeEach(async () => {
    await truncateTables()
    app = bootstrapRestApi().listen(ADMIN_FUND_MANAGEMENT_REST_API_PORT)
    sinon.stub(accountServiceOperations, 'findOrCreateKinesisRevenueAccount').resolves({ id: revenueAccountId })
    sinon
      .stub(referenceDataOperations, 'getCurrencyId')
      .withArgs(CurrencyCode.kau)
      .resolves(kauId)
      .withArgs(CurrencyCode.usd)
      .resolves(usdId)
  })

  afterEach(async () => {
    sinon.restore()
    await app.close()
  })

  it('should approve withdrawal and clear pending withdrawal balance + increase revenue account available balance', async () => {
    const testClient = await createTemporaryTestingAccount()
    const pendingWithdrawalAmount = 1000
    const fee = 25

    const { account: adminAccount, cookie } = await createAccountAndSession(AccountType.admin)
    sinon.stub(accountServiceOperations, 'findAccountWithUserDetails').resolves({
      users: [
        {
          firstName: 'Foo',
          lastName: 'Bar',
        },
      ],
    })

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

    const completeFiatWithdrawalStub = sinon.stub(withdrawalOperations, 'completeFiatWithdrawal').resolves()

    const approvalDate = new Date()

    sinon.stub(expressMiddleware, 'overloadRequestWithSessionInfo').callsFake(async (request, _, next: () => void = () => ({})) => {
      request.account = adminAccount
      next()
    })

    const { status: getStatus } = await request(app)
      .patch(`/api/admin/fund-management/admin-requests/${adminRequest.id}`)
      .send({ status: AdminRequestStatus.approved, updatedAt: approvalDate })
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(getStatus).to.eql(200)

    const adminRequests = await findAllAdminRequests()
    expect(adminRequests[0].status).to.eql(AdminRequestStatus.approved)

    expect(withdrawalRequestUpdateEvent).to.eql({
      channel: WithdrawalPubSubChannels.withdrawalRequestUpdated,
      globalTransactionId: adminRequest.globalTransactionId,
      description: adminRequest.description,
      paymentStatus: 'Processed',
      updatedAt: approvalDate.toISOString(),
      tradingPlatformName: adminRequest.tradingPlatformName,
    })
    expect(completeFiatWithdrawalStub.calledWith(adminRequest.id, adminRequest.fee!)).to.eql(true)
  })

  it('should should fail to approve withdrawal and increase revenue account available balance when not enough available funds for client', async () => {
    const testClient = await createTemporaryTestingAccount()
    const pendingWithdrawalAmount = 1000
    const fee = 25

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

    sinon.stub(withdrawalOperations, 'completeFiatWithdrawal').throws('Error')
    sinon.stub(expressMiddleware, 'overloadRequestWithSessionInfo').callsFake(async (request, _, next: () => void = () => ({})) => {
      request.account = adminAccount
      next()
    })

    const { status: getStatus } = await request(app)
      .patch(`/api/admin/fund-management/admin-requests/${adminRequest.id}`)
      .send({ status: AdminRequestStatus.approved, updatedAt: new Date() })
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(getStatus).to.eql(400)

    const epicurus = getEpicurusInstance()
    let withdrawalRequestUpdateEvent
    epicurus.subscribe(WithdrawalPubSubChannels.withdrawalRequestUpdated, params => (withdrawalRequestUpdateEvent = params))

    expect(withdrawalRequestUpdateEvent).to.eql(undefined)
  })

  it('should approve redemption admin request for account and reset pendingRedemption balance for account back to 0 and increase kinesis revenue balance by the amount', async () => {
    const testClient = await createTemporaryTestingAccount()
    sinon.stub(accountServiceOperations, 'findAccountWithUserDetails').resolves(testClient)

    const redemptionAmount = 90
    const fee = 12

    const { account: adminAccount, cookie } = await createAccountAndSession(AccountType.admin)
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

    const transferToEmissionStub = sinon.stub()
    sinon.stub(blockGatewayOperations, 'getOnChainCurrencyManagerForEnvironment').returns({
      getCurrencyFromTicker: () =>
        ({
          transferFromExchangeHoldingsToEmissionsAccount: transferToEmissionStub,
        } as any),
    } as any)

    sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves({ maxDecimals: 2 })

    const triggerMultipleBalanceChangesStub = sinon.stub(balanceOperations, 'triggerMultipleBalanceChanges').resolves()
    sinon.stub(expressMiddleware, 'overloadRequestWithSessionInfo').callsFake(async (request, _, next: () => void = () => ({})) => {
      request.account = adminAccount
      next()
    })

    const { status: getStatus } = await request(app)
      .patch(`/api/admin/fund-management/admin-requests/${adminRequest.id}`)
      .send({ status: AdminRequestStatus.approved, updatedAt: new Date() })
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(getStatus).to.eql(200)

    expect(
      triggerMultipleBalanceChangesStub.calledWith([
        {
          type: balanceOperations.BalanceAsyncRequestType.confirmPendingRedemption,
          payload: {
            sourceEventType: SourceEventType.adminRequest,
            sourceEventId: adminRequest.id,
            currencyId: kauId,
            accountId: testClient.id,
            amount: new Decimal(adminRequest.amount)
              .plus(adminRequest.fee!)
              .toDecimalPlaces(2)
              .toNumber(),
          },
        },
        {
          type: balanceOperations.BalanceAsyncRequestType.updateAvailable,
          payload: {
            sourceEventType: SourceEventType.adminRequest,
            sourceEventId: adminRequest.id,
            currencyId: kauId,
            accountId: revenueAccountId,
            amount: adminRequest.fee!,
          },
        },
      ]),
    )
    expect(transferToEmissionStub.calledWith(adminRequest.amount)).to.eql(true)
  })

  it('should transfer pending deposit funds to available balance when approved and create currency transaction', async () => {
    const testClient = await createTemporaryTestingAccount()
    sinon.stub(accountServiceOperations, 'findAccountWithUserDetails').resolves(testClient)

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

    const confirmPendingDepositStub = sinon.stub(balanceOperations, 'confirmPendingDeposit').resolves()
    const createCurrencyTransactionStub = sinon.stub(orderOperations, 'createCurrencyTransaction').resolves()
    sinon.stub(expressMiddleware, 'overloadRequestWithSessionInfo').callsFake(async (request, _, next: () => void = () => ({})) => {
      request.account = adminAccount
      next()
    })

    const { status: getStatus } = await request(app)
      .patch(`/api/admin/fund-management/admin-requests/${adminRequest.id}`)
      .send({ status: AdminRequestStatus.approved, updatedAt: new Date() })
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(getStatus).to.eql(200)

    const adminRequests = await findAllAdminRequests()
    expect(adminRequests[0].status).to.eql(AdminRequestStatus.approved)

    expect(
      confirmPendingDepositStub.calledWith({
        sourceEventType: SourceEventType.adminRequest,
        sourceEventId: adminRequest.id,
        currencyId: usdId,
        accountId: testClient!.id,
        amount: adminRequest.amount,
      }),
    ).to.eql(true)
    expect(
      createCurrencyTransactionStub.calledWith({
        accountId: testClient!.id,
        amount: adminRequest.amount,
        currencyId: usdId,
        direction: TransactionDirection.deposit,
        requestId: adminRequest.id,
      }),
    ).to.eql(true)
  })
})
