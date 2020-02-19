import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { ACCOUNT_REST_API_PORT } from '@abx-service-clients/account'
import { Logger, LogLevel } from '@abx-utils/logging'

export async function bootstrapAccountsService() {
  Logger.configure((process.env.LOG_LEVEL as LogLevel) || LogLevel.debug)

  console.log(`Bootstrapping account service API`)
  const publicApi = await bootstrapRestApi()

  console.log(`Adding internal API endpoints`)
  await bootstrapInternalApi(publicApi)

  return publicApi.listen(ACCOUNT_REST_API_PORT)
}
