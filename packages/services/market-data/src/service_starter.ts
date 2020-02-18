import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { runReferenceDataMigrations } from './migrations/migration-runner'
import { Environment } from '@abx-types/reference-data'
import { openSocket } from './websocket-api/depth-update.sockets'
import { MARKET_DATA_REST_API_PORT } from '@abx-service-clients/market-data'
import { Logger, LogLevel } from '@abx-utils/logging'

export async function bootstrapMarketDataService() {
  Logger.configure((process.env.LOG_LEVEL as LogLevel) || LogLevel.debug)

  await runReferenceDataMigrations()
  const app = bootstrapRestApi()

  bootstrapInternalApi(app)
  const server = app.listen(MARKET_DATA_REST_API_PORT)

  if (process.env.NODE_ENV !== Environment.test) {
    openSocket(server)
  }
}
