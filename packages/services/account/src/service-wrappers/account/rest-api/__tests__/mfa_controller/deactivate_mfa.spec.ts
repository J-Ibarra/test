import { expect } from 'chai'
import * as http from 'http'
import * as speakeasy from 'speakeasy'
import request from 'supertest'
import { updateUser, findUserByIdWithAccount } from '../../../../../core'
import { bootstrapRestApi } from '../..'
import { createAccountAndSession } from '@abx-utils/account'
import { truncateTables } from '@abx-utils/db-connection-utils'
import { ACCOUNT_REST_API_PORT } from '@abx-service-clients/account'
import { AccountType } from '@abx-types/account'

describe('api:mfa/deactivation', () => {
  let app: http.Server

  beforeEach(async () => {
    await truncateTables()
    app = bootstrapRestApi().listen(ACCOUNT_REST_API_PORT)
  })

  afterEach(async () => {
    app.close()
  })

  it('returns a 401 error if the user is not logged in', async () => {
    const { status, body } = await request(app).delete('/api/mfa/123124').set('Accept', 'application/json')

    expect(status).to.eql(401)
    expect(Object.keys(body)).to.have.lengthOf(1)
  })

  it('deletes the MFA key from the database on deactivation', async () => {
    const { cookie, id } = await createAccountAndSession()
    const { base32: secret } = speakeasy.generateSecret({
      name: 'KBE',
    })

    await updateUser({
      mfaSecret: secret,
      id,
    })

    const token = speakeasy.totp({
      secret,
      encoding: 'base32',
    })

    const { status } = await request(app).delete(`/api/mfa/${token}`).set('Accept', 'application/json').set('Cookie', cookie)

    expect(status).to.eql(200)
  })

  it('deletes the MFA key from the database on deactivation', async () => {
    const { id } = await createAccountAndSession()
    const { base32: secret } = speakeasy.generateSecret({
      name: 'KBE',
    })

    await updateUser({
      mfaSecret: secret,
      id,
    })
    const userBeforeMfaReset = await findUserByIdWithAccount(id)

    const { cookie: adminCookie } = await createAccountAndSession(AccountType.admin)

    const { status } = await request(app)
      .delete(`/api/mfa/admin/${userBeforeMfaReset!.account!.hin}`)
      .set('Accept', 'application/json')
      .set('Cookie', adminCookie)

    const userAfterMfaReset = await findUserByIdWithAccount(id)

    expect(status).to.eql(200)
    expect(userAfterMfaReset!.mfaSecret).to.eql(null)
  })
})
