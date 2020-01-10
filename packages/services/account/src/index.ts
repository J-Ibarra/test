import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'

function bootstrap() {
  bootstrapRestApi()
  bootstrapInternalApi()
}

bootstrap()
