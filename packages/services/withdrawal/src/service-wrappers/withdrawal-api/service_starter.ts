import { bootstrapRestApi } from './rest-api'
import { WITHDRAWAL_API_SERVICE_PORT } from '@abx-service-clients/withdrawal'
import { LogLevel, Logger } from '@abx-utils/logging'
import { bootstrapInternalApi } from './internal-api'
import { runDepositDataMigrations } from '../../migrations/migration-runner'

export async function bootstrapWithdrawalApiService() {
  Logger.configure((process.env.LOG_LEVEL as LogLevel) || LogLevel.debug)
  runDepositDataMigrations()

  const publicApi = bootstrapRestApi()
  bootstrapInternalApi(publicApi)

  return publicApi.listen(WITHDRAWAL_API_SERVICE_PORT)
}
