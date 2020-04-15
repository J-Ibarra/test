import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { WithdrawalCompletionPendingPayload } from './model'
import { WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL } from '@abx-service-clients/withdrawal'
import { processWithdrawalCompletionRequest } from './withdrawal_completion_message_validation_proxy'

export function bootstrapWithdrawalCompletionPendingQueueProcessor() {
  const queuePoller = getQueuePoller()

  queuePoller.subscribeToQueueMessages<WithdrawalCompletionPendingPayload>(
    WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL!,
    processWithdrawalCompletionRequest,
  )
}
