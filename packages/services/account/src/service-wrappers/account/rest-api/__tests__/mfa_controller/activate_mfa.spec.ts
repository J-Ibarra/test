import { expect } from 'chai'
import * as http from 'http'
import request from 'supertest'
import { updateUser } from '../../../../../core'
import { bootstrapRestApi } from '../..'
import { createAccountAndSession } from '@abx-query-libs/account'
import { truncateTables } from '@abx-utils/db-connection-utils'

describe('api:mfa/activation', () => {
  let app: http.Server

  beforeEach(async () => {
    await truncateTables()
    app = bootstrapRestApi()
  })

  afterEach(async () => {
    await app.close()
  })

  it('returns a 401 error when the user is not logged in', async () => {
    const { body, status } = await request(app)
      .post('/api/mfa')
      .set('Accept', 'application/json')

    expect(status).to.eql(401)
    expect(Object.keys(body)).to.have.lengthOf(1)
  })

  it('when MFA is set up, throws a 400 error', async () => {
    const { cookie, id } = await createAccountAndSession()

    await updateUser({
      mfaSecret: '123secret',
      id,
    })

    const { status, body } = await request(app)
      .post('/api/mfa')
      .set('Accept', 'application/json')
      .set('Cookie', cookie)

    expect(status).to.eql(400)
    expect(Object.keys(body)).to.have.lengthOf(1)
  })

  it('returns the secret and the QR code url when the user is logged in and MFA is not set up yet', async () => {
    const { cookie } = await createAccountAndSession()

    const { body, status } = await request(app)
      .post('/api/mfa')
      .set('Accept', 'application/json')
      .set('Cookie', cookie)

    expect(status).to.eql(200)
    expect(body).to.have.property('mfaTempSecret')
    expect(body).to.have.property('qrcodeUrl')
    expect(body).to.have.property('message')
  })
})
