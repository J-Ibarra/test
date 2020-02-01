import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { runBalanceMigrations } from './migrations/migration-runner'

import './core'

export async function bootstrapBalanceService() {
  await runBalanceMigrations()
  bootstrapInternalApi()
  bootstrapRestApi()
}
