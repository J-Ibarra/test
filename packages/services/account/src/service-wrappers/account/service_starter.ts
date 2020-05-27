import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { ACCOUNT_REST_API_PORT } from '@abx-service-clients/account'
import { Logger, LogLevel } from '@abx-utils/logging'
import { killProcessOnSignal } from '@abx-utils/internal-api-tools'
import { runAccountDataMigrations } from '../../migrations/migration-runner'
import { Environment } from '@abx-types/reference-data'

export async function bootstrapAccountsService() {
  killProcessOnSignal()

  Logger.configure((process.env.LOG_LEVEL as LogLevel) || LogLevel.debug)

  if (process.env.NODE_ENV !== Environment.development && process.env.NODE_ENV !== Environment.e2eLocal) {
    runAccountDataMigrations()
  }

  console.log(`Bootstrapping account service API`)
  const publicApi = await bootstrapRestApi()

  console.log(`Adding internal API endpoints`)
  await bootstrapInternalApi(publicApi)

  const server = publicApi.listen(ACCOUNT_REST_API_PORT)

  /** Due to intermittent 502 response on the Load balancer side, the following 2 server settings need to be made. */
  server.keepAliveTimeout = 65000 // Ensure all inactive connections are terminated by the ALB, by setting this a few seconds higher than the ALB idle timeout
  server.headersTimeout = 66000 // Ensure the headersTimeout is set higher than the keepAliveTimeout due to this nodejs regression bug: https://github.com/nodejs/node/issues/27363
}
