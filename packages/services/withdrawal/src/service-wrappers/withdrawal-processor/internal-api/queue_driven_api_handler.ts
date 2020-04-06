import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { WITHDRAWAL_STATUS_CHANGE_QUEUE_URL, localRedisWithdrawalChangeTopic } from '@abx-service-clients/withdrawal'
import { consumeFiatWithdrawalQueueMessages } from './queued-message-consumer.ts'

export function bootstrapQueueDrivenApi() {
  const queuePoller = getQueuePoller()

  queuePoller.subscribeToQueueMessages(WITHDRAWAL_STATUS_CHANGE_QUEUE_URL || localRedisWithdrawalChangeTopic, consumeFiatWithdrawalQueueMessages)
}
