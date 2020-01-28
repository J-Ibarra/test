import { expect } from 'chai'
import * as http from 'http'
import * as speakeasy from 'speakeasy'
import request from 'supertest'
import { activateMfa } from '../../../core'
import { bootstrapRestApi } from '../..'
import { createAccountAndSession } from '@abx-utils/account'
import { truncateTables } from '@abx-utils/db-connection-utils'

describe('api:mfa/verification', () => {
  let app: http.Server

  beforeEach(async () => {
    await truncateTables()
    app = bootstrapRestApi()
  })

  afterEach(async () => {
    await app.close()
  })

  it('should return a 401 error when the user is not logged in', async () => {
    const { body, status } = await request(app)
      .post('/api/mfa/verification')
      .send('123123')
      .set('Accept', 'application/json')

    expect(status).to.eql(401)
    expect(Object.keys(body)).to.have.lengthOf(1)
  })

  it('returns a bad request error when the payload is not provided', async () => {
    const { cookie } = await createAccountAndSession()

    const { status, body } = await request(app)
      .post('/api/mfa/verification')
      .set('Accept', 'application/json')
      .set('Cookie', cookie)

    expect(status).to.eql(403)
    expect(Object.keys(body)).to.have.lengthOf(0)
  })

  it('gives back a success response when token is correct and is within the required timestep', async () => {
    const { cookie, id, email } = await createAccountAndSession()

    const { mfaTempSecret } = await activateMfa(id, email)
    const token = speakeasy.totp({
      secret: mfaTempSecret,
      encoding: 'base32',
    })

    const { status } = await request(app)
      .post('/api/mfa/verification')
      .send({ token })
      .set('Accept', 'application/json')
      .set('Cookie', cookie)

    expect(status).to.eql(200)
  })
})
