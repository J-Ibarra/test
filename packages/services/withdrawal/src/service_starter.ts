import { bootstrapInternalApi } from './internal-api'
import { bootstrapRestApi } from './rest-api'
import { configureWithdrawalHandler } from './service_configurator'
import { WITHDRAWAL_REST_API_PORT } from '@abx-service-clients/withdrawal'
import { LogLevel, Logger } from '@abx-utils/logging'
import { killProcessOnSignal } from '@abx-utils/internal-api-tools'

export async function bootstrapWithdrawalService() {
  killProcessOnSignal()
  Logger.configure((process.env.LOG_LEVEL as LogLevel) || LogLevel.debug)

  await configureWithdrawalHandler()
  const publicApi = bootstrapRestApi()

  bootstrapInternalApi(publicApi)

  return publicApi.listen(WITHDRAWAL_REST_API_PORT)
}
