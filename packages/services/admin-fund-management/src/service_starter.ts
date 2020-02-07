import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { ADMIN_FUND_MANAGEMENT_REST_API_PORT } from '@abx-service-clients/admin-fund-management'

export function bootstrapFundManagementService() {
  const publicApi = bootstrapRestApi()

  bootstrapInternalApi(publicApi)

  return publicApi.listen(ADMIN_FUND_MANAGEMENT_REST_API_PORT)
}
