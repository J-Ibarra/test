import { expect } from 'chai'
import request from 'supertest'
import { bootstrapRestApi } from '../../rest-api'
import { REFERENCE_DATA_REST_API_PORT } from '@abx-service-clients/reference-data'
import { createAccountAndSession } from '@abx-utils/account'
import { AccountType } from '@abx-types/account'
import { insertMobileVersions } from '../test_utils'

describe('api:exchange-config', () => {
  let app

  beforeEach(async () => {
    app = bootstrapRestApi().listen(REFERENCE_DATA_REST_API_PORT)
  })

  afterEach(async () => {
    await app.close()
  })

  it('should retrieve the mobile versions', async () => {
    const mobileVersions = {
      ios: '1.0.3',
      android: '1.0.94',
      forceVersionUpdate: true,
    }

    await insertMobileVersions(mobileVersions)

    const { cookie } = await createAccountAndSession(AccountType.individual)
    const { status, body } = await request(app).get('/api/mobile/versions').set('Cookie', cookie).send()

    expect(status).to.eql(200)
    expect(body.ios).to.eql(mobileVersions.ios)
    expect(body.android).to.eql(mobileVersions.android)
    expect(body.forceVersionUpdate).to.eql(mobileVersions.forceVersionUpdate)
  })
})
