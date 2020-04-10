import { Logger } from '@abx-utils/logging'
import { QueuePoller, QueueMessageHandler, QueueConsumerOutput } from './queue_poller'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { AwsQueueObserver } from './aws_queue_poller'

interface MessageWrapper {
  payload: any,
}

/**
 * This should only be used for local development.
 */
export class LocalRedisQueuePoller implements QueuePoller {
  private logger = Logger.getInstance('local-redis-queue-poller', 'LocalRedisQueuePoller')

  private epicurus
  private readonly awsQueueObserver = new AwsQueueObserver()

  constructor() {
    this.epicurus = getEpicurusInstance()
  }

  subscribeToQueueMessages<Т>(queueUrl: string, handler: QueueMessageHandler<Т>) {
    if (!queueUrl.startsWith('local')) {
      this.awsQueueObserver.subscribeToQueueMessages(queueUrl, handler)
    } else {
      this.epicurus.subscribe(queueUrl, (message: any) => this.handleMessage(message, queueUrl, handler))
    }
  }

  async handleMessage<Т>(message: MessageWrapper, queueUrl: string, handler: QueueMessageHandler<Т>) {
    try {
      const result = await handler(message.payload)

      if (result && (result as QueueConsumerOutput).skipMessageDeletion) {
        setTimeout(() => this.epicurus.publish(queueUrl, message), 10000)
      }
    } catch (e) {
      this.logger.error(`Error ocurred while invoking handler for message ${message} on queue ${queueUrl}`)
      throw e
    }
  }
}
