import '../../core'
import { configureDepositHandler } from './service_configurator'
import { getExchangeDepositPollingFrequency } from '@abx-service-clients/reference-data'
import { runDepositDataMigrations } from '../../migrations/migration-runner'
import { bootstrapQueueDrivenApi } from './internal-api/queue_request_consumer'
import { bootstrapInternalApi } from './internal-api'
import { bootstrapRestApi } from './rest-api'
import { DEPOSIT_API_PORT } from '@abx-service-clients/deposit'
import { LogLevel, Logger } from '@abx-utils/logging'

export async function bootstrapDepositProcessor() {
  Logger.configure((process.env.LOG_LEVEL as LogLevel) || LogLevel.debug)

  const pollingFrequency = await getExchangeDepositPollingFrequency()
  await configureDepositHandler(pollingFrequency)
  await runDepositDataMigrations()
  await bootstrapQueueDrivenApi()
  const publicApi = await bootstrapRestApi()
  bootstrapInternalApi(publicApi)

  return publicApi.listen(DEPOSIT_API_PORT)
}
