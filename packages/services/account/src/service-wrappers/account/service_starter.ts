import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { ACCOUNT_REST_API_PORT } from '@abx-service-clients/account'

export async function bootstrapAccountsService() {
  console.log(`Bootstrapping account service API`)
  const publicApi = await bootstrapRestApi()

  console.log(`Adding internal API endpoints`)
  await bootstrapInternalApi(publicApi)

  return publicApi.listen(ACCOUNT_REST_API_PORT)
}
