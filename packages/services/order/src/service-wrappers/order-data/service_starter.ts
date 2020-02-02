import { bootstrapInternalApi } from './internal-api'
import { bootstrapRestApi, ORDER_DATA_API_PORT } from './rest-api'
import '../../core'
import { runOrderDataMigrations } from '../../migrations/migration-runner'

export async function bootstrapOrderDataService() {
  await runOrderDataMigrations()

  const restApi = bootstrapRestApi()
  bootstrapInternalApi(restApi)

  restApi.listen(ORDER_DATA_API_PORT)
}
