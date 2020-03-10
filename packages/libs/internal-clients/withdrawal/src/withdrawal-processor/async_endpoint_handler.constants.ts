import { Environment } from '@abx-types/reference-data'

export const environmentsWithLocalRedisQueue = [Environment.development, Environment.e2eLocal, Environment.test]

export const localRedisWithdrawalChangeTopic = 'local-withdrawal-change-topic'
export const localRedisWithdrawalCompletionTopic = 'local-withdrawal-completion-topic'
export const localRedisNewTransactionTopic = 'local-withdrawal-new-transaction-topic'

/** The queue used to trigger withdrawal request changes (e.g fiat withdrawal approval/rejection). */
export const WITHDRAWAL_STATUS_CHANGE_QUEUE_URL = process.env.WITHDRAWAL_STATUS_CHANGE_QUEUE_URL || localRedisWithdrawalChangeTopic

/** The queue where the withdrawal requests initially land after being validated by the withdrawal-api service. (Step 1 of the withdrawal processing flow) */
export const WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL = process.env.WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL || localRedisNewTransactionTopic

/**  The queue where withdrawal messages land after the withdrawal transaction is created. (Step 2 of the withdrawal flow) */
export const WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL = process.env.WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL || 'local-transaction-sent-topis'

/** The queue where withdrawal requests pending completion are queued. Step 3/final of the withdrawal flow. */
export const WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL =
  process.env.WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL || localRedisWithdrawalCompletionTopic
