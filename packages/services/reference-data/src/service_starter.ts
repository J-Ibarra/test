import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { runReferenceDataMigrations } from './migrations/migration-runner'

import './core'

export async function bootstrapReferenceDataService() {
  await runReferenceDataMigrations()
  bootstrapInternalApi()
  return bootstrapRestApi()
}
