import { getQueuePoller } from './queue-poller'
import { consumerQueueMessage } from './queued_message_consumer'

export function bootstrapQueueDrivenApi() {
  const queuePoller = getQueuePoller()

  queuePoller.subscribeToQueueMessages(process.env.BALANCE_CHANGE_QUEUE_URL || 'local-balance-change-queue', consumerQueueMessage)
}
