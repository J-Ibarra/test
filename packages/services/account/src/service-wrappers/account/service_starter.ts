import { bootstrapRestApi, ACCOUNT_REST_API_PORT } from './rest-api'
import { bootstrapInternalApi } from './internal-api'

export async function bootstrapAccountsService() {
  const publicApi = await bootstrapRestApi()
  await bootstrapInternalApi(publicApi)

  return publicApi.listen(ACCOUNT_REST_API_PORT)
}
