import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL } from '@abx-service-clients/withdrawal'
import { WithdrawalTransactionSent } from './model'
import { recordWithdrawalOnChainTransaction } from './withdrawal_transaction_request_recorder'

export function bootstrapWithdrawalSentRecorderQueueProcessor() {
  const queuePoller = getQueuePoller()

  queuePoller.subscribeToQueueMessages<WithdrawalTransactionSent>(WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL!, recordWithdrawalOnChainTransaction)
}
