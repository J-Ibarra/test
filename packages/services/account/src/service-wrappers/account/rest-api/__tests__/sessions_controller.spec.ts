import { expect } from 'chai'
import * as speakeasy from 'speakeasy'
import request from 'supertest'
import sinon from 'sinon'
import { Account, AccountType, User } from '@abx-types/account'
import { bootstrapRestApi } from '..'
import { createAccountAndSession, TEST_PASSWORD, createTemporaryTestingAccount } from '@abx-utils/account'
import { updateUser } from '../../../../core'
import { truncateTables } from '@abx-utils/db-connection-utils'
import * as notificationClientOperations from '@abx-service-clients/notification'
import * as orderClientOperations from '@abx-service-clients/order'
import { ACCOUNT_REST_API_PORT } from '@abx-service-clients/account'
import * as depositOperations from '@abx-service-clients/deposit'

describe.only('api:sessions', () => {
  let app

  beforeEach(async () => {
    await truncateTables()
    // Needed because MFA is disabled by default in the test environment
    process.env.NODE_ENV = 'test-2'
    app = bootstrapRestApi().listen(ACCOUNT_REST_API_PORT)
    sinon.stub(notificationClientOperations, 'createEmail')
    sinon.stub(orderClientOperations, 'cancelAllOrdersForAccount')
  })

  afterEach(async () => {
    process.env.NODE_ENV = 'test'
    await app.close()
    sinon.restore()
  })

  it('does not allow a user to log in if their account has been suspended', async () => {
    const { cookie: adminCookie, account, email } = await createAccountAndSession(AccountType.admin)

    await request(app)
      .patch(`/api/admin/accounts/${account.id}/suspension`)
      .send({ suspended: true })
      .set('Accept', 'application/json')
      .set('Cookie', adminCookie)

    const { status, body } = await request(app)
      .post('/api/sessions')
      .send({
        email,
        password: TEST_PASSWORD,
      })
      .set('Accept', 'application/json')

    expect(status).to.eql(403)
    expect(body).to.have.property('message', 'Account suspended')
  })

  it('allows a user to log in if their account has not been suspended', async () => {
    const testAccount: Account = await createTemporaryTestingAccount(AccountType.admin)
    const user: User = testAccount.users![0]

    const createWalletAddressesForNewAccount = sinon.stub(depositOperations, 'createWalletAddressesForNewAccount').resolves()

    const { status, body } = await request(app)
      .post('/api/sessions')
      .send({
        email: user.email,
        password: TEST_PASSWORD,
      })
      .set('Accept', 'application/json')

    expect(status).to.eql(200)
    expect(body).to.have.property('accountId', testAccount.id)
    expect(body).to.have.property('email', user.email)
    expect(createWalletAddressesForNewAccount.calledWith(testAccount.id)).to.eql(true)
  })

  it('does not allow a user to log in if they provide an incorrect password', async () => {
    const testAccount: Account = await createTemporaryTestingAccount(AccountType.admin)
    const user: User = testAccount.users![0]

    const { status, body } = await request(app)
      .post('/api/sessions')
      .send({
        email: user.email,
        password: '1234',
      })
      .set('Accept', 'application/json')

    expect(status).to.eql(400)
    expect(body).to.have.property('message', 'Email and/or password are incorrect')
  })

  it('does not allow a user to log in if they provide an incorrect email', async () => {
    await createTemporaryTestingAccount(AccountType.admin)

    const { status, body } = await request(app)
      .post('/api/sessions')
      .send({
        email: 'jane.doe1234@abx.com',
        password: TEST_PASSWORD,
      })
      .set('Accept', 'application/json')

    expect(status).to.eql(400)
    expect(body).to.have.property('message', 'Email and/or password are incorrect')
  })

  it('does not create session cookie if user has mfa enabled and no mfaToken provided', async () => {
    const testAccount: Account = await createTemporaryTestingAccount(AccountType.admin)
    const user: User = testAccount.users![0]
    const { base32: secret } = speakeasy.generateSecret({
      name: 'KBE',
    })

    await updateUser({ id: user.id, mfaSecret: secret })
    const { status, body, header } = await request(app)
      .post('/api/sessions')
      .send({
        email: user.email,
        password: TEST_PASSWORD,
      })
      .set('Accept', 'application/json')

    expect(status).to.eql(403)
    expect(body.message).to.eql('MFA Required')
    expect(header['Set-Cookie']).to.eql(undefined)
  })

  it('creates session cookie if provided user email has uppercase letters', async () => {
    const testAccount: Account = await createTemporaryTestingAccount(AccountType.admin)
    const user: User = testAccount.users![0]
    const { base32: secret } = speakeasy.generateSecret({
      name: 'KBE',
    })
    const token = speakeasy.totp({
      secret,
      encoding: 'base32',
    })

    await updateUser({ id: user.id, mfaSecret: secret })

    const uppercaseEmail = user.email.toLocaleUpperCase()

    const { status, body, header } = await request(app)
      .post('/api/sessions')
      .send({
        email: uppercaseEmail,
        password: TEST_PASSWORD,
        mfaToken: token,
      })
      .set('Accept', 'application/json')

    expect(status).to.eql(200)
    expect(body).to.have.property('accountId', testAccount.id)
    expect(body).to.have.property('email', user.email)
    expect(header['set-cookie']).to.not.eql(undefined)
  })

  it('creates session cookie if user has mfa enabled and valid mfaToken provided', async () => {
    const testAccount: Account = await createTemporaryTestingAccount(AccountType.admin)
    const user: User = testAccount.users![0]
    const { base32: secret } = speakeasy.generateSecret({
      name: 'KBE',
    })
    const token = speakeasy.totp({
      secret,
      encoding: 'base32',
    })

    await updateUser({ id: user.id, mfaSecret: secret })
    const { status, body, header } = await request(app)
      .post('/api/sessions')
      .send({
        email: user.email,
        password: TEST_PASSWORD,
        mfaToken: token,
      })
      .set('Accept', 'application/json')

    expect(status).to.eql(200)
    expect(body).to.have.property('accountId', testAccount.id)
    expect(body).to.have.property('email', user.email)
    expect(header['set-cookie']).to.not.eql(undefined)
  })

  it('returns 400 when user has mfa enabled and invalid mfaToken provided', async () => {
    const testAccount: Account = await createTemporaryTestingAccount(AccountType.admin)
    const user: User = testAccount.users![0]
    const { base32: secret } = speakeasy.generateSecret({
      name: 'KBE',
    })

    await updateUser({ id: user.id, mfaSecret: secret })
    const { status, body } = await request(app)
      .post('/api/sessions')
      .send({
        email: user.email,
        password: TEST_PASSWORD,
        mfaToken: '123456',
      })
      .set('Accept', 'application/json')

    expect(status).to.eql(400)
    expect(body.message).to.eql('The token you have provided is invalid')
  })
  it('should set the users session to deactivated', async () => {
    const { cookie, email } = await createAccountAndSession(AccountType.individual)

    const { status: loginStatus } = await request(app)
      .post('/api/sessions')
      .send({
        email,
        password: TEST_PASSWORD,
      })
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
    expect(loginStatus).to.eql(200)

    const { status: LogOutStatus } = await request(app)
      .delete('/api/sessions')
      .set('Accept', 'application/json')
      .set('Cookie', cookie)

    expect(LogOutStatus).to.eql(200)
  })
})
