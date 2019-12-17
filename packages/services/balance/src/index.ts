import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { runBalanceMigrations } from './migrations/migration-runner'

bootstrap()

async function bootstrap() {
  await runBalanceMigrations()
  bootstrapInternalApi()
  bootstrapRestApi()
}
