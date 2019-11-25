import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api/note_creator'
import { runNoteMigrations } from './migrations/migration-runner'

bootstrap()

async function bootstrap() {
  await runNoteMigrations()
  bootstrapInternalApi()
  bootstrapRestApi()
}
