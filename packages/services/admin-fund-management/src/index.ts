import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'

async function bootstrap() {
  await bootstrapRestApi()
  await bootstrapInternalApi()
}

bootstrap()
