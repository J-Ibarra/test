import { Email } from '@abx-types/notification'
import { EmailEndpoints, EmailAsyncRequest } from './endpoints'
import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'

export function createEmail(email: Email) {
  return sendAsyncChangeMessage<EmailAsyncRequest>({
    type: EmailEndpoints.createEmail,
    target: {
      local: 'localRedisWithdrawalChangeTopic',
      deployedEnvironment: process.env.EMAIL_REQUEST_QUEUE_URL!,
    },
    payload: {
      type: EmailEndpoints.createEmail,
      payload: email,
    },
  })
}

export function sendNotificationToOps(subject: string, text: string, html?: string) {
  return sendAsyncChangeMessage<EmailAsyncRequest>({
    type: EmailEndpoints.createEmail,
    target: {
      local: 'localRedisWithdrawalChangeTopic',
      deployedEnvironment: process.env.EMAIL_REQUEST_QUEUE_URL!,
    },
    payload: {
      type: EmailEndpoints.createEmail,
      payload: {
        subject,
        text,
        html,
      },
    },
  })
}

export * from './endpoints'
