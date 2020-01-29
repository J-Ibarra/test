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

  subscribeToQueueMessages(queueUrl: string, handler: QueueMessageHandler) {
    this.epicurus.subscribe(queueUrl, handler)
  }
}
