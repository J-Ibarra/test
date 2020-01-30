import { expect } from 'chai'
import * as crypto from 'crypto'
import sinon from 'sinon'
import { apiCookieIv, apiCookieSecret, createTemporaryTestingAccount } from '@abx-utils/account'
import { EmailTemplates } from '@abx-types/notification'
import * as notificationClientOperations from '@abx-service-clients/notification'
import { User } from '@abx-types/account'
import { createAccountVerificationUrl, sendReferralCodeEmail, sendVerificationEmail, findSession } from '../..'
import { truncateTables } from '@abx-utils/db-connection-utils'

describe('users-email-notifications-dispatcher', () => {
  let createEmailStub

  beforeEach(async () => {
    await truncateTables()
    createEmailStub = sinon.stub(notificationClientOperations, 'createEmail')
  })

  afterEach(async () => {
    sinon.restore()
  })

  it('should be of the form /user-verification?userToken={token}', async () => {
    const { users } = await createTemporaryTestingAccount()
    const userId = users![0].id

    const verificationUrl = await createAccountVerificationUrl(userId)

    expect(verificationUrl.includes('/user-verification?userToken=')).to.equal(true)

    const token = verificationUrl.substring(verificationUrl.indexOf('=') + 1)

    const decipher = crypto.createDecipheriv('aes-256-ctr', apiCookieSecret, apiCookieIv)
    let sessionId = decipher.update(token, 'hex', 'utf8')
    sessionId += decipher.final('utf8')
    const session = await findSession(sessionId)

    expect(session!.userId).to.equal(userId)
  })

  it('should send the correct verification email template content', async () => {
    const { users } = await createTemporaryTestingAccount()
    const user = users![0]

    await sendVerificationEmail(user)

    const createEmailArgs = createEmailStub.getCall(0).args

    const createEmailPayload = createEmailArgs[0]
    expect(createEmailPayload.to).to.eql(user.email)
    expect(createEmailPayload.subject).to.eql('Verify your email!')
    expect(createEmailPayload.templateName).to.eql(EmailTemplates.EmailVerificationResend)
    expect(createEmailPayload.templateContent.firstName).to.eql(user.firstName)
    expect(createEmailPayload.templateContent).to.have.property('accountVerificationUrl')
  })

  it('should send the correct referral code template content', async () => {
    const accountHin = 'KM1234'
    const testUser: User = {
      id: 'foo',
      accountId: 'acc id',
      email: 'email',
      passwordHash: 'bar',
      firstName: 'first name',
    }

    process.env.KMS_DOMAIN = 'test-domain'
    await sendReferralCodeEmail(testUser, accountHin)

    const createEmailArgs = createEmailStub.getCall(0).args

    const createEmailPayload = createEmailArgs[0]
    expect(createEmailPayload.to).to.eql(testUser.email)
    expect(createEmailPayload.subject).to.eql('Refer a friend!')
    expect(createEmailPayload.templateName).to.eql(EmailTemplates.UserReferral)
    expect(createEmailPayload.templateContent.firstName).to.eql(testUser.firstName)
    expect(createEmailPayload.templateContent.referralCode).eql(`test-domain/signup?referrer=${accountHin}`)
  })
})
