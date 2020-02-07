import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { ACCOUNT_REST_API_PORT } from '@abx-service-clients/account'

export async function bootstrapAccountsService() {
  const publicApi = await bootstrapRestApi()
  await bootstrapInternalApi(publicApi)

  return publicApi.listen(ACCOUNT_REST_API_PORT)
}
