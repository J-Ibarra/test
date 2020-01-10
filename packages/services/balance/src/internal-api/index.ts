import { bootstrapQueueDrivenApi } from './queue-driven-api'
import { bootstrapRequestResponseApiEndpoints } from './request-response-api'

export function bootstrapInternalApi() {
  bootstrapQueueDrivenApi()
  bootstrapRequestResponseApiEndpoints()
}
