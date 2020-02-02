import '../../core'
import { configureDepositHandler } from './service_configurator'
import { getExchangeDepositPollingFrequency } from '@abx-service-clients/reference-data'
import { runDepositDataMigrations } from '../../migrations/migration-runner'
import { bootstrapQueueDrivenApi } from './internal-api/queue_request_consumer'
import { bootstrapInternalApi } from './internal-api'
import { bootstrapRestApi, DEPOSIT_API_PORT } from './rest-api'

export async function bootstrapDepositProcessor() {
  const pollingFrequency = await getExchangeDepositPollingFrequency()
  await configureDepositHandler(pollingFrequency)
  await runDepositDataMigrations()
  await bootstrapQueueDrivenApi()
  const publicApi = await bootstrapRestApi()
  bootstrapInternalApi(publicApi)

  return publicApi.listen(DEPOSIT_API_PORT)
}
