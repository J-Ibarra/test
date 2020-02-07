import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'
import { runReferenceDataMigrations } from './migrations/migration-runner'
import { REFERENCE_DATA_REST_API_PORT } from '@abx-service-clients/reference-data'

import './core'

export async function bootstrapReferenceDataService() {
  await runReferenceDataMigrations()
  const restApi = bootstrapRestApi()

  bootstrapInternalApi(restApi)
  return restApi.listen(REFERENCE_DATA_REST_API_PORT)
}
