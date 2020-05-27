import { expect } from 'chai'
import { v4 } from 'node-uuid'
import axios from 'axios'
import request from 'supertest'
import sinon from 'sinon'
import { AccountStatus, AccountType, EmailValidationError, PersonalBankDetails } from '@abx-types/account'
import * as notificationClientOperations from '@abx-service-clients/notification'

import { findAccountById, findAccountWithUserDetails, validatePassword, findUserPhoneDetailsByUserId } from '../../../../core'
import { getModel, truncateTables } from '@abx-utils/db-connection-utils'
import { bootstrapRestApi } from '../index'
import { createTemporaryTestingAccount, TEST_PASSWORD, createAccountAndSession } from '@abx-utils/account'
import { ACCOUNT_REST_API_PORT } from '@abx-service-clients/account'

describe('api:accounts', () => {
  let app

  beforeEach(async () => {
    await truncateTables()
    app = bootstrapRestApi().listen(ACCOUNT_REST_API_PORT)
    sinon.stub(notificationClientOperations, 'createEmail')
  })

  afterEach(async () => {
    await app.close()
    sinon.restore()
  })

  it('successfully creates an account, and gets account', async () => {
    const user = {
      firstName: 'fn',
      lastName: 'ln',
      email: 'fn_ln@a.bc',
      password: 'starlight',
    }

    const { status, body: publicAccountView } = await request(app)
      .post(`/api/accounts`)
      .send(user)
      .set('Accept', 'application/json')
    expect(status).to.eql(201)

    // Get a cookie too access the API
    const { cookie } = await createAccountAndSession(AccountType.admin)

    const { status: getStatus, body: getBody } = await request(app)
      .get(`/api/accounts/${publicAccountView.id}`)
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(getStatus).to.eql(200)
    expect(getBody.id).to.eql(publicAccountView.id)
  })

  it('successfully creates an account, with a referrer', async () => {
    const referrer = await createTemporaryTestingAccount()
    const user = {
      firstName: 'fn',
      lastName: 'ln',
      email: 'fn_ln@a.bc',
      password: 'starlight',
      referrerHin: referrer.hin,
    }

    const { status, body: publicAccountView } = await request(app)
      .post(`/api/accounts`)
      .send(user)
      .set('Accept', 'application/json')
    expect(status).to.eql(201)

    const createdAccount = await findAccountWithUserDetails({ id: publicAccountView.id })

    expect(createdAccount!.users![0].referredBy).to.eql(referrer.id)
  })

  it('returns an error if account details are missing', async () => {
    const user = {
      firstName: 1,
      email: 'fn_ln@a.bc',
      password: 'starlight',
    }

    const { status } = await request(app)
      .post(`/api/accounts`)
      .send(user)
      .set('Accept', 'application/json')

    expect(status).to.eql(400)
  })

  it('returns 409 if user exists with the same email', async () => {
    const user = {
      firstName: 'fn',
      lastName: 'ln',
      email: 'fn_ln@a.bc',
      password: 'starlight',
    }

    const { status: initialResponseStatus } = await request(app)
      .post(`/api/accounts`)
      .send(user)
      .set('Accept', 'application/json')
    expect(initialResponseStatus).to.eql(201)

    const { status: repeatedRequestResponseStatus, body } = await request(app)
      .post(`/api/accounts`)
      .send(user)
      .set('Accept', 'application/json')
    expect(repeatedRequestResponseStatus).to.eql(409)
    expect(body.message).to.eql(EmailValidationError.emailTaken)
  })

  it('returns 403 if account making request is not admin and does not match given account id', async () => {
    const { cookie } = await createAccountAndSession()

    const { status: errorStatus, body } = await request(app)
      .get(`/api/accounts/${v4()}`)
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(errorStatus).to.eql(403)
    expect(body.message).to.eql('Unauthorized')
  })

  it('Returns any requested account if requester is admin', async () => {
    const user = {
      firstName: 'fn',
      lastName: 'ln',
      email: 'fn_ln@a.bc',
      password: 'starlight',
    }

    const { body: userAccount } = await request(app)
      .post(`/api/accounts`)
      .send(user)
      .set('Accept', 'application/json')

    const { cookie: adminCookie } = await createAccountAndSession(AccountType.admin)

    const { status, body: account } = await request(app)
      .get(`/api/accounts/${userAccount.id}`)
      .set('Cookie', adminCookie)
      .set('Accept', 'application/json')

    expect(status).to.eql(200)

    expect(account.id).to.eql(userAccount.id)
    expect(account.type).to.eql(AccountType.individual)
  })

  it('verifies account', async () => {
    const user = {
      firstName: 'fn',
      lastName: 'ln',
      email: 'fn_ln@a.bc',
      password: 'starlight',
    }

    const { status } = await request(app)
      .post(`/api/accounts`)
      .send(user)
      .set('Accept', 'application/json')
    expect(status).to.eql(201)

    // Get a cookie too access the API
    const cookie = await logUserIn(user.email, user.password)
    const token = cookie[0].substring(cookie[0].indexOf('=') + 1, cookie[0].indexOf(';'))

    const { status: getStatus, body } = await request(app)
      .post('/api/accounts/verification')
      .send({ userToken: token })
      .set('Accept', 'application/json')

    expect(getStatus).to.eql(200)
    expect(body.status).to.eql(AccountStatus.emailVerified)
  })

  it('verifies account with device', async () => {
    const user = {
      firstName: 'fn',
      lastName: 'ln',
      email: 'fn_ln@a.bc',
      password: 'starlight',
      uuidPhone : "QUOIYEOUWYOE",
    }

    const { status, body: userAccount } = await request(app)
      .post(`/api/accounts`)
      .send(user)
      .set('Accept', 'application/json')
    expect(status).to.eql(201)

    const userPhoneDetails = await findUserPhoneDetailsByUserId(userAccount.users[0].id)

    const { status: getStatus, body } = await request(app)
      .post(`/api/accounts/verification/${userAccount.users[0].id}/device`)
      .send({ verificationCodePhone: userPhoneDetails.verificationCodePhone })
      .set('Accept', 'application/json')

    expect(getStatus).to.eql(200)
    expect(body.status).to.eql(AccountStatus.emailVerified)
  })

  it('succesfully retrieves account if API token present in Authorization header', async () => {
    const credentials = {
      email: 'fn_ln@a.bc',
      password: 'starlight',
    }

    const { body: publicAccountView } = await request(app)
      .post(`/api/accounts`)
      .send(credentials)
      .set('Accept', 'application/json')

    // Creating API token
    const { body: createTokenBody } = await request(app)
      .post(`/api/tokens`)
      .send(credentials)
      .set('Accept', 'application/json')

    const { status, body } = await request(app)
      .get(`/api/accounts/${publicAccountView.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', createTokenBody.token)

    expect(status).to.eql(200)
    expect(body.id).to.eql(publicAccountView.id)
  })

  it('successfully finds all accounts starting with a given hin', async () => {
    // Get a cookie too access the API
    const { account, cookie } = await createAccountAndSession(AccountType.admin)
    await createTemporaryTestingAccount()
    await createTemporaryTestingAccount()

    // Creating API token
    const { status, body } = await request(app)
      .get(`/api/admin/accounts/search?hin=${account.hin!.substring(0, 3)}`)
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(status).to.eql(200)
    expect(body.length).to.eql(2)
  })

  it('should set hasTriggeredKycCheck to true on /accounts/kyc-form-submission POST request', async () => {
    // Get a cookie too access the API
    const { account, cookie } = await createAccountAndSession()

    // Creating API token
    const { status, body } = await request(app)
      .post(`/api/accounts/kyc-form-submission`)
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(status).to.eql(200)
    expect(body.hasTriggeredKycCheck).to.eql(true)
    const updatedAccount = await findAccountById(account.id)
    expect(updatedAccount!.hasTriggeredKycCheck).to.eql(true)
  })

  it('should get personal bank details', async () => {
    // Get a cookie too access the API
    const { account, cookie } = await createAccountAndSession()
    const bankAccountDetails = await createBankAccountDetails(account.id)

    // Creating API token
    const { status, body } = await request(app)
      .get(`/api/accounts/bank-details`)
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(status).to.eql(200)
    expect(body.accountHolderName).to.eql(bankAccountDetails.accountHolderName)
    expect(body.bankName).to.eql(bankAccountDetails.bankName)
  })

  it('should create personal bank details', async () => {
    // Get a cookie too access the API
    const { account, cookie } = await createAccountAndSession()
    const bankAccountDetails = {
      accountHolderName: 'FooBar',
      iban: 'test iban',
      bankName: 'test bank name',
      bankSwiftCode: 'swift code',
      routingCode: 'routing code',
      abaNumber: 'aba numberr',
      accountNumber: 'acc num',
      notes: 'Dummy notes',
      accountId: account.id,
    }

    // Creating API token
    const { status } = await request(app)
      .post(`/api/accounts/bank-details`)
      .send({
        accountHolderName: 'FooBar',
        iban: 'test iban',
        bankName: 'test bank name',
        bankSwiftCode: 'swift code',
        routingCode: 'routing code',
        abaNumber: 'aba numberr',
        accountNumber: 'acc num',
        notes: 'Dummy notes',
      })
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(status).to.eql(200)

    const createdBankDetails = await getModel<PersonalBankDetails>('bank_details').findOne({
      where: { accountHolderName: bankAccountDetails.accountHolderName },
    })

    expect(createdBankDetails).to.not.eql(null)
  })

  it('should update personal bank details', async () => {
    // Get a cookie too access the API
    const { account, cookie } = await createAccountAndSession()
    const bankAccountDetails = await createBankAccountDetails(account.id)

    const newIban = 'updatedIBan'

    // Creating API token
    const { status } = await request(app)
      .post(`/api/accounts/bank-details`)
      .send({
        id: bankAccountDetails.id,
        accountHolderName: bankAccountDetails.accountHolderName,
        bankName: bankAccountDetails.bankName,
        iban: newIban,
      })
      .set('Cookie', cookie)
      .set('Accept', 'application/json')

    expect(status).to.eql(200)

    const updatedBankDetails = await getModel<PersonalBankDetails>('bank_details').findOne({
      where: { accountHolderName: bankAccountDetails.accountHolderName },
    })

    expect(updatedBankDetails!.get().iban).to.eql(newIban)
  })

  it('should change password on /accounts/password PATCH request', async () => {
    const { account, cookie } = await createAccountAndSession()
    const newPassword = 'fooBar'

    // Creating API token
    const { status } = await request(app)
      .patch(`/api/accounts/password`)
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ currentPassword: TEST_PASSWORD, newPassword })

    expect(status).to.eql(204)

    const updatedAccount = await findAccountWithUserDetails({ id: account.id })

    const newPasswordValid = await validatePassword(newPassword, updatedAccount!.users![0].passwordHash)
    expect(newPasswordValid).to.eql(true)
  })
})

const createBankAccountDetails = async (accountId: string) => {
  const bankAccountDetails = {
    accountHolderName: 'FooBar',
    iban: 'test iban',
    bankName: 'test bank name',
    bankSwiftCode: 'swift code',
    routingCode: 'routing code',
    abaNumber: 'aba numberr',
    accountNumber: 'acc num',
    notes: 'Dummy notes',
    accountId,
  }

  const instance = await getModel<PersonalBankDetails>('bank_details').create(bankAccountDetails)

  return instance.get()
}

export async function logUserIn(email: string, password: string): Promise<string> {
  const login = await axios.post(`http://localhost:${ACCOUNT_REST_API_PORT}/api/sessions`, {
    email,
    password,
  })

  return login.headers['set-cookie']
}
