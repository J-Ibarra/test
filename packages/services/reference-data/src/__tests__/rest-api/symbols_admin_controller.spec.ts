import { expect } from 'chai'
import request from 'supertest'
import { bootstrapRestApi } from '../../rest-api'
import { REFERENCE_DATA_REST_API_PORT } from '@abx-service-clients/reference-data'
import { createAccountAndSession } from '@abx-utils/account'
import { AccountType } from '@abx-types/account'

describe('api:symbols-admin', () => {
  let app

  beforeEach(async () => {
    app = bootstrapRestApi().listen(REFERENCE_DATA_REST_API_PORT)
  })

  afterEach(async () => {
    await app.close()
  })

  it('should update symbol orderRange when calling PATCH symbols/admin/KAU_USD passing in { amount }', async () => {
    const orderRangeSet = 0.1
    const { cookie } = await createAccountAndSession(AccountType.admin)
    const { status } = await request(app).patch('/api/symbols/admin/KAU_USD').set('Cookie', cookie).send({ amount: orderRangeSet })

    expect(status).to.eql(200)

    const { body } = await request(app).get('/api/symbols?includeOrderRange=true').set('Cookie', cookie)

    const kauUsdPair = body.find(({ id }) => id === 'KAU_USD')
    expect(kauUsdPair.orderRange).to.eql(orderRangeSet)
  })
})
