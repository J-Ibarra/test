import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { WithdrawalCompletionPendingPayload } from './model'
import { completeWithdrawalRequest } from './withdrawal_request_completer'
import { WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL } from '@abx-service-clients/withdrawal'

export function bootstrapWithdrawalCompletionPendingQueueProcessor() {
  const queuePoller = getQueuePoller()

  queuePoller.subscribeToQueueMessages<WithdrawalCompletionPendingPayload>(
    WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL!,
    completeWithdrawalRequest,
  )
}
