/** A mechanism for subscribing to queue messages. */
export interface QueuePoller {
  subscribeToQueueMessages<T>(queueUrl: string, handler: QueueMessageHandler<T>)
}

export type QueueMessageHandler<T> = (message: T) => Promise<void>
