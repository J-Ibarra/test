import { bootstrapInternalApi } from './internal-api'
import { bootstrapRestApi } from './rest-api'
import { REPORT_REST_API_PORT } from '@abx-service-clients/report'

export async function bootstrapReportsService() {
  const publicApi = bootstrapRestApi()
  bootstrapInternalApi(publicApi)

  return publicApi.listen(REPORT_REST_API_PORT)
}
