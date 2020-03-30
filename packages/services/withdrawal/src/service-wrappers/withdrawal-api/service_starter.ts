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

  const server = publicApi.listen(WITHDRAWAL_API_SERVICE_PORT)

  /** Due to intermittent 502 response on the Load balancer side, the following 2 server settings need to be made. */
  server.keepAliveTimeout = 65000 // Ensure all inactive connections are terminated by the ALB, by setting this a few seconds higher than the ALB idle timeout
  server.headersTimeout = 66000 // Ensure the headersTimeout is set higher than the keepAliveTimeout due to this nodejs regression bug: https://github.com/nodejs/node/issues/27363

  return server
}
