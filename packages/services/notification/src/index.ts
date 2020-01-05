import { bootstrapInternalApi } from './internal-api/create_email'

import './core'

bootstrap()

async function bootstrap() {
  bootstrapInternalApi()
}
