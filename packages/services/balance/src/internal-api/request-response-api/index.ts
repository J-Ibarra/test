import { bootstrapQueryEndpoints } from './query_endpoints'
import { bootstrapChangeEndpoints } from './change_endpoints'

export function bootstrapRequestResponseApiEndpoints() {
  bootstrapQueryEndpoints()
  bootstrapChangeEndpoints()
}
