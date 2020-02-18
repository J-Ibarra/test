import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api/bootstrap'
import '../../core'
import { runOrderDataMigrations } from '../../migrations/migration-runner'
import { Environment } from '@abx-types/reference-data'
import { ORDER_GATEWAY_API_PORT } from '@abx-service-clients/order'
import { Logger, LogLevel } from '@abx-utils/logging'

export async function bootstrapOrderGatewayService() {
  Logger.configure((process.env.LOG_LEVEL as LogLevel) || LogLevel.debug)
  await runOrderDataMigrations()

  if (process.env.NODE_ENV !== Environment.test) {
    const publicApi = bootstrapRestApi()
    bootstrapInternalApi(publicApi)
    publicApi.listen(ORDER_GATEWAY_API_PORT)
  }
}
