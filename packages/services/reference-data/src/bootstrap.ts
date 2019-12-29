import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { runReferenceDataMigrations } from './migrations/migration-runner'

import './core'

export async function bootstrap() {
  await runReferenceDataMigrations()
  bootstrapInternalApi()
  return bootstrapRestApi()
}
