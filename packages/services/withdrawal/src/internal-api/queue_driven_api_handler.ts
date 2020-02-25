import { getQueuePoller } from '@abx-utils/async-message-consumer'
import {
  WITHDRAWAL_STATUS_CHANGE_QUEUE_URL,
  localRedisWithdrawalChangeTopic,
  WITHDRAWAL_COMPLETED_QUEUE_URL,
  localRedisWithdrawalCompletionTopic,
} from '@abx-service-clients/withdrawal/src/async_endpoint_handler.constants'
import { consumeFiatWithdrawalQueueMessages, consumeCompletedWithdrawalQueueMessage } from './queued-message-consumer.ts'

export function bootstrapQueueDrivenApi() {
  const queuePoller = getQueuePoller()

<<<<<<< HEAD
  queuePoller.subscribeToQueueMessages(WITHDRAWAL_STATUS_CHANGE_QUEUE_URL || localRedisWithdrawalChangeTopic, consumeFiatWithdrawalQueueMessages)
  queuePoller.subscribeToQueueMessages(WITHDRAWAL_COMPLETED_QUEUE_URL || localRedisWithdrawalCompletionTopic, consumeCompletedWithdrawalQueueMessage)
=======
  queuePoller.subscribeToQueueMessages(process.env.WITHDRAWAL_CHANGE_REQUEST_QUEUE_URL || localRedisBalanceChangeTopic, consumeQueueMessage)
>>>>>>> develop
}
