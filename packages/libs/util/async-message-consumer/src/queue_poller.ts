/** A mechanism for subscribing to queue messages. */
export interface QueuePoller {
  subscribeToQueueMessages<T>(queueUrl: string, handler: QueueMessageHandler<T>)
}

/** Allows the client to control the behavior of the consumer. */
export interface QueueConsumerOutput {
  /** When set to true, the message will be left on the queue (not deleted), so that it can be reattempted. */
  skipMessageDeletion: boolean
}

export type QueueMessageHandler<T> = (message: T) => Promise<void | QueueConsumerOutput>
