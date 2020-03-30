export const QUEUE_GATEWAY = 'QUEUE_GATEWAY'

export interface QueueGateway<T> {
  /**
   * Subscribes to messages of a given queue.
   *
   * @param queueName the name of the queue
   */
  subscribeToQueueMessages(queueName: string, handler: (message: T) => Promise<void>)
}
