import { Email } from '@abx-types/notification'

export enum EmailEndpoints {
  createEmail = 'exchange:notification:createEmail',
  sendNotificationToOps = 'exchange:notification:sendNotificationToOps',
}

export interface SendEmailToOpsPayload {
  subject
  text
  html
}

export type EmailAsyncRequestPayload = Email | SendEmailToOpsPayload

export interface EmailAsyncRequest {
  type: EmailEndpoints
  payload: EmailAsyncRequestPayload
}
