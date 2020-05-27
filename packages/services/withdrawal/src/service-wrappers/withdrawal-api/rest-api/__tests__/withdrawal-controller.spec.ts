import { bootstrapRestApi } from '..'
import request from 'supertest'
import sinon from 'sinon'
import { expect } from 'chai'
import { createAccountAndSession } from '@abx-utils/account'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import { WITHDRAWAL_API_SERVICE_PORT } from '@abx-service-clients/withdrawal'
import { Server } from 'http'
import * as coreOperations from '../../../../core'

const currencyCode = 'KAU'

describe('WithdrawalController', () => {
  let app: Server

  beforeEach(async () => {
    app = bootstrapRestApi().listen(WITHDRAWAL_API_SERVICE_PORT)
  })

  afterEach(async () => {
    sinon.restore()
    await app.close()
  })

  it(`should return 400 because of pending withdrawal requests on GET /withdrawals/configs/${currencyCode}`, async () => {
    sinon.stub(coreOperations, 'checkForNonCompletedWithdrawalRequests').resolves(true)

    const { cookie } = await createAccountAndSession()

    const { body, status } = await request(app).post(`/api/withdrawals/configs/${currencyCode}`).set('Cookie', cookie)

    expect(status).to.eql(400)
    expect(body).to.eql({ message: `There are withdrawal requests in progress for currency ${currencyCode}. Please try again later` })
  })

  it(`should return 500 for internal service error on GET /withdrawals/configs/${currencyCode}`, async () => {
    sinon.stub(coreOperations, 'checkForNonCompletedWithdrawalRequests').resolves(false)
    sinon.stub(referenceDataOperations, 'updateWithdrawalConfigForCurrency').resolves(Promise.reject({}))

    const { cookie } = await createAccountAndSession()

    const { status } = await request(app).post(`/api/withdrawals/configs/${currencyCode}`).set('Cookie', cookie)

    expect(status).to.eql(500)
  })

  it(`should return 200 success on GET /withdrawals/configs/${currencyCode}`, async () => {
    sinon.stub(coreOperations, 'checkForNonCompletedWithdrawalRequests').resolves(false)
    sinon.stub(referenceDataOperations, 'updateWithdrawalConfigForCurrency').resolves(Promise.resolve({}))

    const { cookie } = await createAccountAndSession()

    const { status } = await request(app).post(`/api/withdrawals/configs/${currencyCode}`).set('Cookie', cookie)

    expect(status).to.eql(200)
  })
})
