import { expect } from 'chai'
import * as http from 'http'
import request from 'supertest'
import { createAccount, updateUser } from '../../../../../core'
import { bootstrapRestApi } from '../..'
import { CreateAccountRequest, AccountType } from '@abx-types/account'
import { truncateTables } from '@abx-utils/db-connection-utils'

const email = 'a@b.com'
const password = '123qwe'
const acc: CreateAccountRequest = {
  firstName: 'fn',
  lastName: 'ln',
  email,
  password,
}

describe('api:mfa query', () => {
  let app: http.Server

  beforeEach(async () => {
    await truncateTables()
    app = bootstrapRestApi()
  })

  afterEach(async () => {
    await app.close()
  })

  it('should return false when the user belonging to the username does not exist', async () => {
    const { status, body } = await request(app)
      .get(`/api/mfa?email=${email}`)
      .set('Accept', 'application/json')

    expect(status).to.eql(200)
    expect(body).to.have.property('enabled', false)
  })

  it('returns true if the user has enabled MFA when the user id is provided', async () => {
    const { users } = await createAccount(acc, AccountType.individual)

    await updateUser({
      mfaSecret: 'mysecret123',
      id: users![0].id,
    })

    const { status, body } = await request(app)
      .get(`/api/mfa?email=${email}`)
      .set('Accept', 'application/json')

    expect(status).to.eql(200)
    expect(body).to.have.property('enabled', true)
  })

  it('should return false when MFA is not enabled for the user', async () => {
    await createAccount(acc, AccountType.individual)

    const { status, body } = await request(app)
      .get(`/api/mfa?email=${email}`)
      .set('Accept', 'application/json')

    expect(status).to.eql(200)
    expect(body).to.have.property('enabled', false)
  })
})
