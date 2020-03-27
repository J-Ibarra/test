import { bootstrapInternalApi } from './internal-api'
import { bootstrapRestApi } from './rest-api'
import { REPORT_REST_API_PORT } from '@abx-service-clients/report'
import { Logger, LogLevel } from '@abx-utils/logging'
import { killProcessOnSignal } from '@abx-utils/internal-api-tools'

export async function bootstrapReportsService() {
  killProcessOnSignal()

  Logger.configure((process.env.LOG_LEVEL as LogLevel) || LogLevel.debug)

  const publicApi = bootstrapRestApi()
  bootstrapInternalApi(publicApi)

  const server = publicApi.listen(REPORT_REST_API_PORT)
  /** Due to intermittent 502 response on the Load balancer side, the following 2 server settings need to be made. */
  server.keepAliveTimeout = 65000 // Ensure all inactive connections are terminated by the ALB, by setting this a few seconds higher than the ALB idle timeout
  server.headersTimeout = 66000 // Ensure the headersTimeout is set higher than the keepAliveTimeout due to this nodejs regression bug: https://github.com/nodejs/node/issues/27363
}
