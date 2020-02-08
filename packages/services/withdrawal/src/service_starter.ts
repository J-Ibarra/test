import { bootstrapInternalApi } from './internal-api'
import { bootstrapRestApi } from './rest-api'
import { configureWithdrawalHandler } from './service_configurator'
import { WITHDRAWAL_REST_API_PORT } from '@abx-service-clients/withdrawal'

export async function bootstrapWithdrawalService() {
  await configureWithdrawalHandler()
  const publicApi = bootstrapRestApi()

  bootstrapInternalApi(publicApi)

  return publicApi.listen(WITHDRAWAL_REST_API_PORT)
}
