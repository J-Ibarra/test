import { QueuePoller, QueueMessageHandler } from './queue_poller'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { AwsQueueObserver } from './aws_queue_poller'

/**
 * This should only be used for local development.
 */
export class LocalRedisQueuePoller implements QueuePoller {
  private epicurus
  private readonly awsQueueObserver = new AwsQueueObserver()

  constructor() {
    this.epicurus = getEpicurusInstance()
  }

  subscribeToQueueMessages<Т>(queueUrl: string, handler: QueueMessageHandler<Т>) {
    if (!queueUrl.startsWith('local')) {
      this.awsQueueObserver.subscribeToQueueMessages(queueUrl, handler)
    } else {
      this.epicurus.subscribe(queueUrl, handler)
    }
  }
}
