import { Email } from '@abx-types/notification'

export enum EmailEndpoints {
  createEmail = 'exchange:notification:createEmail',
  sendNotificationToOps = 'exchange:notification:sendNotificationToOps',
}

export interface OpsEmailPayload {
  subject
  text
  html
}

export type EmailAsyncRequestPayload = Email | OpsEmailPayload

export interface EmailAsyncRequest {
  type: EmailEndpoints
  payload: EmailAsyncRequestPayload
}
