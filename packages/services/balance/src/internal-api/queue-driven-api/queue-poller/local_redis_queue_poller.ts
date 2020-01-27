import { QueuePoller } from './queue_poller'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { BalanceChangeAsyncRequestContainer } from '@abx-types/balance'

/**
 * This should only be used for local development.
 */
export class LocalRedisQueuePoller implements QueuePoller {
  epicurus

  constructor() {
    this.epicurus = getEpicurusInstance()
  }

  subscribeToQueueMessages(queueUrl: string, handler: (message: BalanceChangeAsyncRequestContainer) => Promise<void>) {
    this.epicurus.subscribe(queueUrl, handler)
  }
}
