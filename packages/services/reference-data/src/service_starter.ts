import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { runReferenceDataMigrations } from './migrations/migration-runner'
import { REFERENCE_DATA_REST_API_PORT } from '@abx-service-clients/reference-data'

import './core'
import { Logger, LogLevel } from '@abx-utils/logging'
import { killProcessOnSignal } from '@abx-utils/internal-api-tools'

export async function bootstrapReferenceDataService() {
  killProcessOnSignal()
  Logger.configure((process.env.LOG_LEVEL as LogLevel) || LogLevel.debug)

  await runReferenceDataMigrations()
  const restApi = bootstrapRestApi()

  bootstrapInternalApi(restApi)
  return restApi.listen(REFERENCE_DATA_REST_API_PORT)
}
