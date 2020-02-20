import { Environment } from '@abx-types/reference-data'
import { EmailEndpoints, localRedisEmailTopic, EmailAsyncRequest, OpsEmailPayload } from '@abx-service-clients/notification'
import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { sendNotificationToOps, sendEmail } from '../core/lib/email/mandrill'
import { Email } from '@abx-types/notification'
import { Logger } from '@abx-utils/logging'

const localEnvironments = [Environment.test, Environment.development, Environment.e2eLocal]

const logger = Logger.getInstance('notification', 'create_email')

export function bootstrapInternalApi() {
  const queuePoller = getQueuePoller()

  queuePoller.subscribeToQueueMessages(process.env.EMAIL_REQUEST_QUEUE_URL || localRedisEmailTopic, consumeQueueMessage)
}

async function consumeQueueMessage({ payload, type }: EmailAsyncRequest) {
  logger.debug(`Consumed queue message of type ${type}`)

  if (!localEnvironments.includes(process.env.NODE_ENV as Environment)) {
    if (type === EmailEndpoints.sendNotificationToOps) {
      const opsEmailContent = payload as OpsEmailPayload
      await sendNotificationToOps(opsEmailContent.subject, opsEmailContent.text, opsEmailContent.html)
    } else {
      await sendEmail(payload as Email)
    }
  }
}
