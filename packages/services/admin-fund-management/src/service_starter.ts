import { bootstrapRestApi, ADMIN_FUND_MANAGEMENT_REST_API_PORT } from './rest-api'
import { bootstrapInternalApi } from './internal-api'

export function bootstrapFundManagementService() {
  const publicApi = bootstrapRestApi()

  bootstrapInternalApi(publicApi)

  return publicApi.listen(ADMIN_FUND_MANAGEMENT_REST_API_PORT)
}
