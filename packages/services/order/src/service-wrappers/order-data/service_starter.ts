import { bootstrapInternalApi } from './internal-api'
import { bootstrapRestApi } from './rest-api'
import '../../core'
import { runOrderDataMigrations } from '../../migrations/migration-runner'
import { ORDER_DATA_API_PORT } from '@abx-service-clients/order'
import { Logger, LogLevel } from '@abx-utils/logging'
import { killProcessOnSignal } from '@abx-utils/internal-api-tools'

export async function bootstrapOrderDataService() {
  killProcessOnSignal()

  Logger.configure((process.env.LOG_LEVEL as LogLevel) || LogLevel.debug)
  await runOrderDataMigrations()

  const restApi = bootstrapRestApi()
  bootstrapInternalApi(restApi)

  restApi.listen(ORDER_DATA_API_PORT)
}
