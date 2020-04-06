import { LogLevel, Logger } from '@abx-utils/logging'
import { bootstrapInternalApi } from './internal-api'
import {
  bootstrapWithdrawalSentRecorderQueueProcessor,
  bootstrapNewWithdrawalRequestQueueProcessor,
  bootstrapWithdrawalCompletionPendingQueueProcessor,
} from './core'
import { runWithdrawalDataMigrations } from '../../migrations/migration-runner'
import { Environment } from '@abx-types/reference-data'

export async function bootstrapWithdrawalProcessorService() {
  Logger.configure((process.env.LOG_LEVEL as LogLevel) || LogLevel.debug)
  if (process.env.NODE_ENV !== Environment.development && process.env.NODE_ENV !== Environment.e2eLocal) {
    runWithdrawalDataMigrations()
  }

  bootstrapWithdrawalSentRecorderQueueProcessor()
  bootstrapNewWithdrawalRequestQueueProcessor()
  bootstrapWithdrawalCompletionPendingQueueProcessor()

  bootstrapInternalApi()
}
