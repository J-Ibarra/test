import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { runNoteMigrations } from './migrations/migration-runner'

bootstrap()

async function bootstrap() {
  await runNoteMigrations()
  bootstrapInternalApi()
  bootstrapRestApi()
}
