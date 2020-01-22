import { expect } from 'chai'
import request from 'supertest'
import sinon from 'sinon'
import { CurrencyCode } from '@abx-types/reference-data'
import { bootstrapRestApi } from '..'
import { createTemporaryTestingAccount, createAccountAndSession } from '@abx-query-libs/account'
import { AccountType } from '@abx-types/account'
import * as accountServiceOperations from '@abx-service-clients/account'
import * as balanceOperations from '@abx-service-clients/balance'
import { ValidationError } from '@abx-types/error'

describe('api:account_summary', () => {
  let app: ReturnType<typeof bootstrapRestApi>
  let testClient

  beforeEach(async () => {
    testClient = await createTemporaryTestingAccount()
    app = bootstrapRestApi()
  })

  afterEach(async () => {
    sinon.restore()
    await app.close()
  })

  it('should retrieve account summary', async () => {
    const kauBalance = 112

    sinon.stub(accountServiceOperations, 'findAccountWithUserDetails').resolves(testClient)
    sinon.stub(balanceOperations, 'findAllBalancesForAccount').resolves([
      {
        currency: CurrencyCode.kau,
        available: { value: kauBalance },
      },
    ])

    const { cookie } = await createAccountAndSession(AccountType.admin)

    const { status: getStatus, body: getBody } = await request(app)
      .get(`/api/admin/fund-management/account-summary/${testClient.hin}`)
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(getStatus).to.eql(200)
    expect(getBody.balances.find(({ currency: balanceCurrency }) => balanceCurrency === CurrencyCode.kau)!.available).to.eql(kauBalance)
  })

  it("should try and retrieve account summary but fail because the account hin doesn't exist ", async () => {
    const expectedError = new ValidationError('Unable to find account')
    const { cookie } = await createAccountAndSession(AccountType.admin)

    sinon.stub(accountServiceOperations, 'findAccountWithUserDetails').resolves(null)

    const { status: getStatus, body } = await request(app)
      .get(`/api/admin/fund-management/account-summary/FAIL-ME`)
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(getStatus).to.eql(400)
    expect(body.message).to.eql(expectedError.message)
  })
})
