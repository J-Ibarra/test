import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api'

export async function bootstrapFundManagementService() {
  await bootstrapRestApi()
  await bootstrapInternalApi()
}
