import { Email } from '@abx-types/notification'
import { getEpicurusInstance } from '@abx/db-connection-utils'
import { EmailEndpoints } from './endpoints'

export function createEmail(email: Email) {
  const epicurus = getEpicurusInstance()
  
  return epicurus.request(EmailEndpoints.createEmail, { email })
}

export * from './endpoints'
