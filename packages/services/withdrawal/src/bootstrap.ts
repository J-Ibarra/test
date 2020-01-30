import { bootstrapInternalApi } from './internal-api'
import { bootstrapRestApi } from './rest-api'
import { configureWithdrawalHandler } from '.'

async function bootstrap() {
  await configureWithdrawalHandler()
  bootstrapInternalApi()
  bootstrapRestApi()
}

bootstrap()
