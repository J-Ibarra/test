import { bootstrapInternalApi } from './internal-api'
import { bootstrapRestApi } from './rest-api'
import '../../core'
import { runOrderDataMigrations } from '../../migrations/migration-runner'

export async function bootstrapOrderDataService() {
  await runOrderDataMigrations()
  bootstrapInternalApi()
  bootstrapRestApi()
}
