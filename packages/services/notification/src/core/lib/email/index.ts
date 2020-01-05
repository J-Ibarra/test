import { Logger } from '@abx/logging'
import { sequelize, getModel } from '@abx/db-connection-utils'
import { Email, EmailAttachment } from '@abx-types/notification'
import { sendEmail } from './mandrill'

const logger = Logger.getInstance('notification', 'email')

export async function createEmail(emailParams: Email) {
  logger.debug(`Sending ${emailParams.templateName} to ${emailParams.to}`)
  const newEmail = await create(emailParams)
  const newEmailValues = newEmail.get()

  const { mandrillResult, notificationStatus } = await sendEmail(newEmailValues)

  await newEmail.update({ notificationStatus, mandrillResult })

  return newEmail.get()
}

async function create(emailParams: Email): Promise<any> {
  return await sequelize.transaction(async transaction => {
    return await getModel<Email>('email').create(emailParams, {
      include: [{ model: getModel<EmailAttachment>('emailAttachment'), as: 'attachments' }],
      transaction,
    })
  })
}

export async function findEmails(query): Promise<Email[]> {
  const emails = await getModel<Email>('email').findAll(query)
  return emails.map(email => email.get())
}

export async function findEmailAttachments(query): Promise<EmailAttachment[]> {
  const attachments = await getModel<EmailAttachment>('emailAttachment').findAll(query)
  return attachments.map(attachment => attachment.get())
}
