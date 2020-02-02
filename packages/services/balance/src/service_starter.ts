import { bootstrapRestApi, BALANCE_REST_API_PORT } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { runBalanceMigrations } from './migrations/migration-runner'

import './core'

export async function bootstrapBalanceService() {
  await runBalanceMigrations()
  const restApi = bootstrapRestApi()

  bootstrapInternalApi(restApi)

  return restApi.listen(BALANCE_REST_API_PORT)
}
