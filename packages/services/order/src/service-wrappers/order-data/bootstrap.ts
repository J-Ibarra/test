import { bootstrapInternalApi } from './internal-api'
import { bootstrapRestApi } from './rest-api'
import '../../core'
import { runOrderDataMigrations } from '../../migrations/migration-runner'

async function bootstrap() {
  await runOrderDataMigrations()
  bootstrapInternalApi()
  bootstrapRestApi()
}

bootstrap()
