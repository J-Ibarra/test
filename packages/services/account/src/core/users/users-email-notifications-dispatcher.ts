import { Transaction } from 'sequelize'
import { createEmail } from '@abx-service-clients/notification'
import { Logger } from '@abx-utils/logging'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { Email, EmailTemplates } from '@abx-types/notification'
import { User } from '@abx-types/account'
import { createCookie } from '../account/session'

const logger = Logger.getInstance('api', 'user-email-notification-dispatcher')

export async function createAccountVerificationUrl(userId: string, transaction?: Transaction): Promise<string> {
  return wrapInTransaction(sequelize, transaction, async t => {
    logger.debug(`Generated account verification URL for user ${userId}`)

    const token = await createCookie(userId, t, 24)
    const url = process.env.KMS_DOMAIN + '/user-verification?userToken=' + token

    logger.debug(`Generated verification url: ${url}`)
    return url
  })
}

export function prepareWelcomeEmail(user: User, accountVerificationUrl: string, hin?: string) {
  return {
    to: user.email,
    subject: 'Welcome to Kinesis!',
    templateName: EmailTemplates.WelcomeEmail,
    templateContent: {
      email: user.email,
      accountVerificationUrl,
      hin,
    },
  } as Email
}

export async function sendVerificationEmail(user: User, transaction?: Transaction) {
  const verificationEmailContent = await wrapInTransaction(sequelize, transaction, async t => {
    const accountVerificationUrl = await createAccountVerificationUrl(user.id, t)

    return {
      to: user.email,
      subject: 'Verify your email!',
      templateName: EmailTemplates.EmailVerificationResend,
      templateContent: {
        firstName: user.firstName || '',
        accountVerificationUrl,
      },
    } as Email
  })

  return createEmail(verificationEmailContent)
}

export async function sendReferralCodeEmail(user: User, accountHin: string) {
  const emailRequest: Email = {
    to: user.email,
    subject: 'Refer a friend!',
    templateName: EmailTemplates.UserReferral,
    templateContent: {
      firstName: user.firstName!,
      referralCode: process.env.KMS_DOMAIN + `/signup?referrer=${accountHin}`,
    },
  }

  return createEmail(emailRequest)
}
