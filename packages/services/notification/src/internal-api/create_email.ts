import { Environment } from '@abx-types/reference-data'
import { EmailEndpoints, localRedisEmailTopic, EmailAsyncRequest, OpsEmailPayload, EmailAsyncRequestPayload } from '@abx-service-clients/notification'
import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { sendNotificationToOps } from '../core/lib/email/mandrill'
import { Email } from '@abx-types/notification'
import { Logger } from '@abx-utils/logging'
import { createEmail } from '../core'

const localEnvironments = [Environment.test, Environment.development]

const logger = Logger.getInstance('notification', 'create_email')

export function bootstrapInternalApi() {
  const queuePoller = getQueuePoller()

  queuePoller.subscribeToQueueMessages(process.env.EMAIL_REQUEST_QUEUE_URL || localRedisEmailTopic, consumeQueueMessage)
}

async function consumeQueueMessage({ payload, type }: EmailAsyncRequest) {
  logger.debug(`Consumed queue message of type ${type}`)

  if (!localEnvironments.includes(process.env.NODE_ENV as Environment)) {
    handleSendEmailCommand(payload, type)
  }
}

async function handleSendEmailCommand(payload: EmailAsyncRequestPayload, type: EmailEndpoints) {
  if (type === EmailEndpoints.sendNotificationToOps) {
    const opsEmailContent = payload as OpsEmailPayload
    await sendNotificationToOps(opsEmailContent.subject, opsEmailContent.text, opsEmailContent.html)
  } else {
    try {
      await createEmail(payload as Email)
    } catch (e) {
      logger.error(`Unable to send email ${JSON.stringify(payload)}`)
    }
  }
}
