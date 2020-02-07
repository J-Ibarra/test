import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { runBalanceMigrations } from './migrations/migration-runner'

import './core'
import { BALANCE_REST_API_PORT } from '@abx-service-clients/balance'

export async function bootstrapBalanceService() {
  await runBalanceMigrations()
  const restApi = bootstrapRestApi()

  bootstrapInternalApi(restApi)

  return restApi.listen(BALANCE_REST_API_PORT)
}
