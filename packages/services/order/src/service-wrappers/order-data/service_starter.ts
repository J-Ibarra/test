import { bootstrapInternalApi } from './internal-api'
import { bootstrapRestApi } from './rest-api'
import '../../core'
import { runOrderDataMigrations } from '../../migrations/migration-runner'
import { ORDER_DATA_API_PORT } from '@abx-service-clients/order'

export async function bootstrapOrderDataService() {
  await runOrderDataMigrations()

  const restApi = bootstrapRestApi()
  bootstrapInternalApi(restApi)

  restApi.listen(ORDER_DATA_API_PORT)
}
