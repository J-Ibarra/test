import { bootstrapRestApi, REST_API_PORT } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { runReferenceDataMigrations } from './migrations/migration-runner'

import './core'

export async function bootstrapReferenceDataService() {
  await runReferenceDataMigrations()
  const restApi = bootstrapRestApi()

  bootstrapInternalApi(restApi)
  return restApi.listen(REST_API_PORT)
}
