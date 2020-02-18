import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { runBalanceMigrations } from './migrations/migration-runner'

import './core'
import { BALANCE_REST_API_PORT } from '@abx-service-clients/balance'
import { Logger, LogLevel } from '@abx-utils/logging'

export async function bootstrapBalanceService() {
  Logger.configure((process.env.LOG_LEVEL as LogLevel) || LogLevel.debug)

  await runBalanceMigrations()
  const restApi = bootstrapRestApi()

  bootstrapInternalApi(restApi)

  return restApi.listen(BALANCE_REST_API_PORT)
}
