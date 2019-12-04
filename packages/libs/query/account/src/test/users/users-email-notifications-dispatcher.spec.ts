import { expect } from 'chai'
import * as crypto from 'crypto'
import sinon from 'sinon'
import { EpicurusRequestChannel } from '../../../commons'
import { apiCookieIv, apiCookieSecret } from '../../../config/secrets'
import * as epicurus from '../../../db/epicurus'
import { createTemporaryTestingAccount, createTemporaryTestingAccountAndEmail } from '../../../db/test_helpers/test_accounts'
import { EmailTemplates } from '../../../notification/interfaces'
import { User } from '../../interface'
import { findSession } from '../../lib/session'
import { createAccountVerificationUrl, sendEmail, sendReferralCodeEmail, sendVerificationEmail } from '../../lib/users'

describe('users-email-notifications-dispatcher', () => {
  const epicurusStub = {
    request: sinon.spy(),
    publish: sinon.spy(),
  }

  beforeEach(async () => {
    sinon.stub(epicurus, 'getInstance').returns(epicurusStub as any)
  })

  afterEach(async () => {
    sinon.restore()
  })

  it('should be of the form /user-verification?userToken={token}', async () => {
    const { users } = await createTemporaryTestingAccount()
    const userId = users[0].id

    const verificationUrl = await createAccountVerificationUrl(userId)

    expect(verificationUrl.includes('/user-verification?userToken=')).to.equal(true)

    const token = verificationUrl.substring(verificationUrl.indexOf('=') + 1)

    const decipher = crypto.createDecipheriv('aes-256-ctr', apiCookieSecret, apiCookieIv)
    let sessionId = decipher.update(token, 'hex', 'utf8')
    sessionId += decipher.final('utf8')
    const session = await findSession(sessionId)

    expect(session.userId).to.equal(userId)
  })

  it('should send the correct verification email template content', async () => {
    const { users } = await createTemporaryTestingAccount()
    const user = users[0]

    await sendVerificationEmail(user)

    const createEmailArgs = epicurusStub.request.getCall(0).args

    expect(createEmailArgs[0]).to.eql(EpicurusRequestChannel.createEmail)
    const createEmailPayload = createEmailArgs[1]
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

    const createEmailArgs = epicurusStub.request.getCall(1).args
    expect(createEmailArgs[0]).to.eql(EpicurusRequestChannel.createEmail)

    const createEmailPayload = createEmailArgs[1]
    expect(createEmailPayload.to).to.eql(testUser.email)
    expect(createEmailPayload.subject).to.eql('Refer a friend!')
    expect(createEmailPayload.templateName).to.eql(EmailTemplates.UserReferral)
    expect(createEmailPayload.templateContent.firstName).to.eql(testUser.firstName)
    expect(createEmailPayload.templateContent.referralCode).eql(`test-domain/signup?referrer=${accountHin}`)
  })

  it('should send the correct welcome email template content', async () => {
    const { account, welcomeEmailContent } = await createTemporaryTestingAccountAndEmail()
    const user = account.users[0]

    const hin = account.hin

    await sendEmail(welcomeEmailContent)

    const createEmailArgs = epicurusStub.request.getCall(2).args

    expect(createEmailArgs[0]).to.eql(EpicurusRequestChannel.createEmail)
    const createEmailPayload = createEmailArgs[1]
    expect(createEmailPayload.subject).to.eql('Welcome to Kinesis!')
    expect(createEmailPayload.templateName).to.eql(EmailTemplates.WelcomeEmail)
    expect(createEmailPayload.templateContent.email).to.eql(user.email)
    expect(createEmailPayload.templateContent.hin).to.eql(`${hin}`)
    expect(createEmailPayload.templateContent.accountVerificationUrl).to.not.eql(null)
  })
})
