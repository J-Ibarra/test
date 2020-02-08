import { expect } from 'chai'
import request from 'supertest'
import sinon from 'sinon'
import { CurrencyCode } from '@abx-types/reference-data'
import { bootstrapRestApi } from '..'
import { createTemporaryTestingAccount, createAccountAndSession } from '@abx-utils/account'
import { AccountType } from '@abx-types/account'
import * as accountServiceOperations from '@abx-service-clients/account'
import * as balanceOperations from '@abx-service-clients/balance'
import { ValidationError } from '@abx-types/error'
import * as expressMiddleware from '@abx-utils/express-middleware'
import { ADMIN_FUND_MANAGEMENT_REST_API_PORT } from '@abx-service-clients/admin-fund-management'

describe('api:account_summary', () => {
  let app

  beforeEach(async () => {
    app = bootstrapRestApi().listen(ADMIN_FUND_MANAGEMENT_REST_API_PORT)
  })

  afterEach(async () => {
    sinon.restore()
    await app.close()
  })

  it('should retrieve account summary', async () => {
    const testClient = await createTemporaryTestingAccount()

    const kauBalance = 112

    sinon.stub(accountServiceOperations, 'findAccountWithUserDetails').resolves(testClient)
    sinon.stub(balanceOperations, 'findAllBalancesForAccount').resolves([
      {
        currency: CurrencyCode.kau,
        available: { value: kauBalance },
      },
    ])

    const { account: adminAccount, cookie } = await createAccountAndSession(AccountType.admin)
    sinon.stub(expressMiddleware, 'overloadRequestWithSessionInfo').callsFake(async (request, _, next: () => void = () => ({})) => {
      request.account = adminAccount
      next()
    })

    const { status: getStatus, body: getBody } = await request(app)
      .get(`/api/admin/fund-management/account-summary/${testClient.hin}`)
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(getStatus).to.eql(200)
    expect(getBody.balances.find(({ currency: balanceCurrency }) => balanceCurrency === CurrencyCode.kau)!.available).to.eql(kauBalance)
  })

  it("should try and retrieve account summary but fail because the account hin doesn't exist ", async () => {
    const expectedError = new ValidationError('Unable to find account')
    const { account, cookie } = await createAccountAndSession(AccountType.admin)

    sinon.stub(accountServiceOperations, 'findAccountWithUserDetails').resolves(null)
    sinon.stub(expressMiddleware, 'overloadRequestWithSessionInfo').callsFake(async (request, _, next: () => void = () => ({})) => {
      request.account = account
      next()
    })

    const { status: getStatus, body } = await request(app)
      .get(`/api/admin/fund-management/account-summary/FAIL-ME`)
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(getStatus).to.eql(400)
    expect(body.message).to.eql(expectedError.message)
  })
})
