import '../../core'
import { bootstrapRestApi } from './rest-api'
import { DEPOSIT_API_PORT } from '@abx-service-clients/deposit'
import { bootstrapInternalApi, bootstrapQueueDrivenApi } from './internal-api'
import { runDepositDataMigrations } from '../../migrations/migration-runner'

export async function bootstrapDepositEntryProcessor() {
  await runDepositDataMigrations()
  await bootstrapQueueDrivenApi()

  const publicApi = await bootstrapRestApi()
  bootstrapInternalApi(publicApi)

  return publicApi.listen(DEPOSIT_API_PORT)
}
