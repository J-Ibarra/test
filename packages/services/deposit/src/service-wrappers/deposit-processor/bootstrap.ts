import '../../core'
import { configureDepositHandler } from './startup'
import { getExchangeDepositPollingFrequency } from '@abx-service-clients/reference-data'
import { runDepositDataMigrations } from '../../migrations/migration-runner'
import { bootstrapQueueDrivenApi } from './core/queue_request_consumer'

async function bootstrap() {
  const pollingFrequency = await getExchangeDepositPollingFrequency()
  await configureDepositHandler(pollingFrequency)
  await runDepositDataMigrations()
  await bootstrapQueueDrivenApi()
}

bootstrap()
