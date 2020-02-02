import { createRequestResponseEndpointHandlers } from './request_response_endpoints_handler'
import { bootstrapQueueDrivenApi } from './queue_driven_api_handler'
import express from 'express'
import { setupInternalApi } from '@abx-utils/internal-api-tools'

export function bootstrapInternalApi(app: express.Express) {
  setupInternalApi(app, createRequestResponseEndpointHandlers())
  bootstrapQueueDrivenApi()
}
