import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { runReferenceDataMigrations } from './migrations/migration-runner'

bootstrap()

async function bootstrap() {
  await runReferenceDataMigrations()
  bootstrapInternalApi()
  bootstrapRestApi()
}
