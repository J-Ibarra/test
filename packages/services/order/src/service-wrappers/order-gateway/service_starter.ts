import { bootstrapRestApi, REST_API_PORT } from './rest-api'
import { bootstrapInternalApi } from './internal-api/bootstrap'
import '../../core'
import { runOrderDataMigrations } from '../../migrations/migration-runner'
import { Environment } from '@abx-types/reference-data'

export async function bootstrapOrderGatewayService() {
  await runOrderDataMigrations()

  if (process.env.NODE_ENV !== Environment.test) {
    const publicApi = bootstrapRestApi()
    bootstrapInternalApi(publicApi)
    publicApi.listen(REST_API_PORT)
  }
}
