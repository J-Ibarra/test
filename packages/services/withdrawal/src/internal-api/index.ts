import { bootstrapRequestResponseApi } from './request_response_endpoints_handler'
import { bootstrapQueueDrivenApi } from './queue_driven_api_handler'

export function bootstrapInternalApi() {
  bootstrapRequestResponseApi()
  bootstrapQueueDrivenApi()
}
