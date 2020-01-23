import { Environment } from '@abx-types/reference-data'
import { EmailEndpoints } from '@abx-service-clients/notification'
import { getEpicurusInstance, messageFactory } from '@abx-utils/db-connection-utils'
import { createEmail } from '../../src/core/lib/email'
import { email } from './create_email_message_schema'

export function bootstrapInternalApi() {
  const epicurus = getEpicurusInstance()

  const localEnvironments = [Environment.test, Environment.development, Environment.e2eLocal]

  return epicurus.server(EmailEndpoints.createEmail, (request, callback) => {
    if (localEnvironments.includes(process.env.NODE_ENV as Environment)) {
      return callback(null, {})
    }

    return messageFactory(email, createEmail)(request, callback)
  })
}
