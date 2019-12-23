import { bootstrapRestApi } from './service-wrappers/order-data/rest-api'
import { bootstrapInternalApi } from './service-wrappers/order-data/internal-api'
import { runReferenceDataMigrations } from './migrations/migration-runner'

bootstrap()

async function bootstrap() {
  await runReferenceDataMigrations()
  bootstrapInternalApi()
  bootstrapRestApi()
}
