import { LogLevel, Logger } from '@abx-utils/logging'
import { bootstrapInternalApi } from './internal-api'
import {
  bootstrapWithdrawalSentRecorderQueueProcessor,
  bootstrapNewWithdrawalRequestQueueProcessor,
  bootstrapWithdrawalCompletionPendingQueueProcessor,
} from './core'
import { runDepositDataMigrations } from '../../migrations/migration-runner'

export async function bootstrapWithdrawalProcessorService() {
  Logger.configure((process.env.LOG_LEVEL as LogLevel) || LogLevel.debug)
  runDepositDataMigrations()

  bootstrapWithdrawalSentRecorderQueueProcessor()
  bootstrapNewWithdrawalRequestQueueProcessor()
  bootstrapWithdrawalCompletionPendingQueueProcessor()

  bootstrapInternalApi()
}
