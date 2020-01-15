import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api/bootstrap'
import '../../core'
import { runOrderDataMigrations } from '../../migrations/migration-runner'

async function bootstrap() {
  await runOrderDataMigrations()
  bootstrapRestApi()
  bootstrapInternalApi()
}

bootstrap()
