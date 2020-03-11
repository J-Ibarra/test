import { Environment } from '@abx-types/reference-data'

export const environmentsWithLocalRedisQueue = [Environment.development, Environment.e2eLocal, Environment.test]

export const localRedisWithdrawalChangeTopic = 'local-withdrawal-change-topic'
export const localRedisWithdrawalCompletionTopic = 'local-withdrawal-completion-topic'
export const localRedisNewTransactionTopic = 'local-withdrawal-new-transaction-topic'

export const WITHDRAWAL_STATUS_CHANGE_QUEUE_URL = process.env.WITHDRAWAL_STATUS_CHANGE_QUEUE_URL || localRedisWithdrawalChangeTopic
export const WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL = process.env.WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL || localRedisNewTransactionTopic
export const WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL = process.env.WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL || 'local-transaction-sent-topis'
export const WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL =
  process.env.WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL || localRedisWithdrawalCompletionTopic
