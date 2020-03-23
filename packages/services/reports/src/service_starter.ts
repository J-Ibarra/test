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

  return publicApi.listen(REPORT_REST_API_PORT)
}
