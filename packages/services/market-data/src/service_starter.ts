import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { runReferenceDataMigrations } from './migrations/migration-runner'
import { Environment } from '@abx-types/reference-data'
import { openSocket } from './websocket-api/depth-update.sockets'

export async function bootstrapMarketDataService() {
  await runReferenceDataMigrations()
  bootstrapInternalApi()
  const server = bootstrapRestApi()

  if (process.env.NODE_ENV !== Environment.test) {
    openSocket(server)
  }
}
