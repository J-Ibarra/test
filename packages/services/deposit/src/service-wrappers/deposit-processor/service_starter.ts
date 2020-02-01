import '../../core'
import { configureDepositHandler } from './service_configurator'
import { getExchangeDepositPollingFrequency } from '@abx-service-clients/reference-data'
import { runDepositDataMigrations } from '../../migrations/migration-runner'
import { bootstrapQueueDrivenApi } from './core/internal-request-processors/queue_request_consumer'
import { bootstrapQueryEndpoints } from './core/internal-request-processors'
import { bootstrapRestApi } from './rest-api'

export async function bootstrapDepositProcessor() {
  const pollingFrequency = await getExchangeDepositPollingFrequency()
  await configureDepositHandler(pollingFrequency)
  await runDepositDataMigrations()
  await bootstrapQueueDrivenApi()
  await bootstrapQueryEndpoints()
  await bootstrapRestApi()
}
