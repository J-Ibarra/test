import { Environment } from '@abx-types/reference-data'

export const environmentsWithLocalRedisQueue = [Environment.development, Environment.e2eLocal, Environment.test]
export const localRedisWithdrawalChangeTopic = 'local-withdrawal-change-topic'
export const localRedisWithdrawalCompletionTopic = 'local-withdrawal-completion-topic'
export const WITHDRAWAL_STATUS_CHANGE_QUEUE_URL = process.env.WITHDRAWAL_STATUS_CHANGE_QUEUE_URL || undefined
export const WITHDRAWAL_COMPLETED_QUEUE_URL = process.env.WITHDRAWAL_COMPLETED_QUEUE_URL || undefined
