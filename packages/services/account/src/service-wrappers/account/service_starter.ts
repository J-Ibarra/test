import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'

export async function bootstrapAccountsService() {
  await bootstrapRestApi()
  await bootstrapInternalApi()
}
