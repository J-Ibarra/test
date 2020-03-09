import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { consumeQueueMessage } from './queued_message_consumer'
import { localRedisWithdrawalChangeTopic } from '@abx-service-clients/withdrawal'

export function bootstrapQueueDrivenApi() {
  const queuePoller = getQueuePoller()

  queuePoller.subscribeToQueueMessages(process.env.WITHDRAWAL_CHANGE_REQUEST_QUEUE_URL || localRedisWithdrawalChangeTopic, consumeQueueMessage)
}
