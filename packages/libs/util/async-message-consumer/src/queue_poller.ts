/** A mechanism for subscribing to queue messages. */
export interface QueuePoller {
  subscribeToQueueMessages(queueUrl: string, handler: QueueMessageHandler)
}

export type QueueMessageHandler = (message: any) => Promise<void>
