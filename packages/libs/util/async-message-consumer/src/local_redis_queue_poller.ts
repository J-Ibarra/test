import { QueuePoller, QueueMessageHandler } from './queue_poller'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'

/**
 * This should only be used for local development.
 */
export class LocalRedisQueuePoller implements QueuePoller {
  epicurus

  constructor() {
    this.epicurus = getEpicurusInstance()
  }

  subscribeToQueueMessages<Т>(queueUrl: string, handler: QueueMessageHandler<Т>) {
    this.epicurus.subscribe(queueUrl, handler)
  }
}
