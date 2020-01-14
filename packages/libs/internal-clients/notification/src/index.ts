import { Email } from '@abx-types/notification'
import { getEpicurusInstance } from '@abx/db-connection-utils'
import { EmailEndpoints } from './endpoints'

export function createEmail(email: Email) {
  const epicurus = getEpicurusInstance()

  return epicurus.request(EmailEndpoints.createEmail, { email })
}

export function sendNotificationToOps(subject: string, text: string, html?: string) {
  const epicurus = getEpicurusInstance()

  return epicurus.request(EmailEndpoints.sendNotificationToOps, { subject, text, html })
}

export * from './endpoints'
