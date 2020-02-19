import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { ADMIN_FUND_MANAGEMENT_REST_API_PORT } from '@abx-service-clients/admin-fund-management'
import { Logger, LogLevel } from '@abx-utils/logging'

export function bootstrapFundManagementService() {
  Logger.configure((process.env.LOG_LEVEL as LogLevel) || LogLevel.debug)
  const publicApi = bootstrapRestApi()

  bootstrapInternalApi(publicApi)

  return publicApi.listen(ADMIN_FUND_MANAGEMENT_REST_API_PORT)
}
