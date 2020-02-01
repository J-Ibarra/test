import { bootstrapInternalApi } from './internal-api'
import { bootstrapRestApi } from './rest-api'
import { configureWithdrawalHandler } from './service_configurator'

export async function bootstrapWithdrawalService() {
  await configureWithdrawalHandler()
  bootstrapInternalApi()
  bootstrapRestApi()
}
