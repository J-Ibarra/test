import '../../core'
import { configureDepositHandler } from './startup'
import { getExchangeDepositPollingFrequency } from '@abx-service-clients/reference-data'
import { runDepositDataMigrations } from '../../migrations/migration-runner'
import { bootstrapQueueDrivenApi } from './core/internal-request-processors/queue_request_consumer'
import { bootstrapQueryEndpoints } from './core/internal-request-processors'

async function bootstrap() {
  const pollingFrequency = await getExchangeDepositPollingFrequency()
  await configureDepositHandler(pollingFrequency)
  await runDepositDataMigrations()
  await bootstrapQueueDrivenApi()
  await bootstrapQueryEndpoints()
}

bootstrap()
