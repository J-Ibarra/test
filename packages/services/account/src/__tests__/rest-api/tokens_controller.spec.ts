import { expect } from 'chai'
import jwt from 'jsonwebtoken'
import { v4 } from 'node-uuid'
import request from 'supertest'
import { getEnvironmentConfig, truncateTables } from '@abx/db-connection-utils'
import { bootstrapRestApi } from '../../rest-api'
import { createTemporaryTestingAccount, TEST_PASSWORD, createAccountAndSession } from '@abx-query-libs/account'
import { TokenResponse } from '../../rest-api/token_controller'

describe('api:tokens', () => {
  let app: ReturnType<typeof bootstrapRestApi>

  beforeEach(async () => {
    await truncateTables()
    app = bootstrapRestApi()
  })

  afterEach(async () => {
    await app.close()
  })

  it('creates a token for account', async () => {
    const { users } = await createTemporaryTestingAccount()

    const user = users![0]
    const { body: token, status }: { body: TokenResponse; status: number } = await request(app)
      .post(`/api/tokens`)
      .send({ email: user.email, password: TEST_PASSWORD })
      .set('Accept', 'application/json')

    expect(status).to.eql(201)

    const verifiedToken = jwt.verify(token.token, getEnvironmentConfig().jwtSecret)

    expect(verifiedToken).not.to.equal(null)
  })

  it('returns error message when creating a token with invalid credentials', async () => {
    const { body, status } = await request(app)
      .post(`/api/tokens`)
      .send({ email: 'invalid@email.com', password: 'invalid-password' })

    expect(status).to.equal(400)
    expect(body.message).to.equal('Email and/or password are incorrect')
  })

  it('gets tokens for account', async () => {
    const { users } = await createTemporaryTestingAccount()

    const user = users![0]
    const { body: createdToken }: { body: TokenResponse } = await request(app)
      .post(`/api/tokens`)
      .send({ email: user.email, password: TEST_PASSWORD })
      .set('Accept', 'application/json')

    const { status: getStatus, body: tokens }: { body: TokenResponse[]; status: number } = await request(app)
      .get(`/api/tokens`)
      .set('Authorization', createdToken.token)
      .set('Accept', 'application/json')

    expect(getStatus).to.eql(200)
    expect(tokens.length).to.equal(1)

    const [token] = tokens

    const verifiedToken = jwt.verify(token.token, getEnvironmentConfig().jwtSecret)

    expect(verifiedToken).not.to.equal(null)
    expect(token.id).to.equal(createdToken.id)
  })

  it('returns empty array if no tokens exist for account', async () => {
    const { cookie } = await createAccountAndSession()

    const { status: getStatus, body: tokens }: { body: TokenResponse[]; status: number } = await request(app)
      .get(`/api/tokens`)
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(getStatus).to.eql(200)
    expect(tokens.length).to.equal(0)
  })

  it('returns 400 response when trying to deactivate a non-existent token', async () => {
    const { cookie } = await createAccountAndSession()

    const { status } = await request(app)
      .delete(`/api/tokens/${v4()}`)
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(status).to.eql(400)
  })

  it('returns 400 response when trying to deactivate from invalid input', async () => {
    const { cookie } = await createAccountAndSession()

    const { status } = await request(app)
      .delete(`/api/tokens/foo`)
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(status).to.equal(400)
  })

  it('deactivates token for account', async () => {
    const { users } = await createTemporaryTestingAccount()

    const user = users![0]
    const { body } = await request(app)
      .post(`/api/tokens`)
      .send({ email: user.email, password: TEST_PASSWORD })
      .set('Accept', 'application/json')

    const tokenId = body.id

    const { status } = await request(app)
      .delete(`/api/tokens/${tokenId}`)
      .set('Authorization', body.token)
      .set('Accept', 'application/json')

    expect(status).to.eql(204)
  })
})
