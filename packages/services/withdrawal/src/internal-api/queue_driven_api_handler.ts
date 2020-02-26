import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { consumeQueueMessage } from './queued_message_consumer'
import { localRedisBalanceChangeTopic } from '@abx-service-clients/balance'

export function bootstrapQueueDrivenApi() {
  const queuePoller = getQueuePoller()

  queuePoller.subscribeToQueueMessages(process.env.WITHDRAWAL_CHANGE_REQUEST_QUEUE_URL || localRedisBalanceChangeTopic, consumeQueueMessage)
}
