import { bootstrapInternalApi } from './internal-api'
import { bootstrapRestApi, WITHDRAWAL_REST_API_PORT } from './rest-api'
import { configureWithdrawalHandler } from './service_configurator'

export async function bootstrapWithdrawalService() {
  await configureWithdrawalHandler()
  const publicApi = bootstrapRestApi()

  bootstrapInternalApi(publicApi)

  return publicApi.listen(WITHDRAWAL_REST_API_PORT)
}
