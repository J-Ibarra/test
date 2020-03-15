import { bootstrapRestApi } from './rest-api'
import { WITHDRAWAL_API_SERVICE_PORT } from '@abx-service-clients/withdrawal'
import { LogLevel, Logger } from '@abx-utils/logging'
import { bootstrapInternalApi } from './internal-api'
import { runWithdrawalDataMigrations } from '../../migrations/migration-runner'
import { Environment } from '@abx-types/reference-data'

export async function bootstrapWithdrawalApiService() {
  Logger.configure((process.env.LOG_LEVEL as LogLevel) || LogLevel.debug)

  if (process.env.NODE_ENV !== Environment.development && process.env.NODE_ENV !== Environment.e2eLocal) {
    runWithdrawalDataMigrations()
  }

  const publicApi = bootstrapRestApi()
  bootstrapInternalApi(publicApi)

  return publicApi.listen(WITHDRAWAL_API_SERVICE_PORT)
}
