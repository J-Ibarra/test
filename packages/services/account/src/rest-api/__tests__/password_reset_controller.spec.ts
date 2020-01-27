import { expect } from 'chai'
import request from 'supertest'
import sinon from 'sinon'

import { generateResetPasswordPayload, validateUserCredentials, generateJWToken } from '../../core'
import { bootstrapRestApi } from '..'
import { createTemporaryTestingAccount } from '@abx-query-libs/account'
import { truncateTables } from '@abx-utils/db-connection-utils'
import * as notificationClientOperations from '@abx-service-clients/notification'

describe('api:reset-password', () => {
  const tokenOptions = {
    expiresIn: '1h',
  }
  let app

  const genericPasswordResetResponse = 'If your email is in our system, you will receive a password recovery link to your inbox shortly.'

  beforeEach(async () => {
    sinon.stub(notificationClientOperations, 'createEmail')
    await truncateTables()
    app = bootstrapRestApi()
  })

  afterEach(async () => {
    await app.close()
    sinon.restore()
  })

  it('return 200 when send email with valid email', async () => {
    const account = await createTemporaryTestingAccount()
    const user = account.users![0]
    const resetPasswordRequest = {
      email: user.email,
    }
    const { body } = await request(app)
      .post('/api/reset-password')
      .send(resetPasswordRequest)
      .set('Accept', 'application/json')
      .expect(200)

    expect(body.message).to.eql(genericPasswordResetResponse)
  })

  it('return 200 when send email with invalid email', async () => {
    const resetPasswordRequest = {
      email: 'fn_ln@asfasdfasdfasdfasdfasdfasd',
    }
    const { body } = await request(app)
      .post('/api/reset-password')
      .send(resetPasswordRequest)
      .set('Accept', 'application/json')
      .expect(200)

    expect(body.message).to.eql(genericPasswordResetResponse)
  })

  it('return 200 if the userId and the token is verified', async () => {
    const account = await createTemporaryTestingAccount()
    const user = account.users![0]
    const payload = generateResetPasswordPayload(user.id)
    const token = generateJWToken(payload, tokenOptions)

    await request(app)
      .get(`/api/reset-password?userId=${user.id}&token=${token}`)
      .set('Accept', 'application/json')
      .expect(200)
  })

  it('return 400 if the userId and the token is not verified', async () => {
    const account = await createTemporaryTestingAccount()
    const user = account.users![0]
    const payload = generateResetPasswordPayload('as;lkfjasdovcidei')
    const token = generateJWToken(payload, tokenOptions)
    await request(app)
      .get(`/api/reset-password?userId=${user.id}&token=${token}`)
      .set('Accept', 'application/json')
      .expect(400)
  })

  it('successfully reset the password with right token', async () => {
    const account = await createTemporaryTestingAccount()
    const user = account.users![0]
    const payload = generateResetPasswordPayload(user.id)
    const token = generateJWToken(payload, tokenOptions)
    const newPassword = ';aosidfjpoasijdfpoasfo'

    const { body: updatedUser } = await request(app)
      .put(`/api/reset-password`)
      .send({
        userId: user.id,
        newPassword,
        newPasswordRetyped: newPassword,
        token,
      })
      .set('Accept', 'application/json')
      .expect(200)

    const validationResultUser = await validateUserCredentials(updatedUser.email, newPassword)

    expect(validationResultUser.id).to.be.equal(user.id)
  })
})
