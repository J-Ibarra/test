import { createOrderQueryEndpointHandlers } from './query_endpoint_handlers'
import express from 'express'
import { setupInternalApi } from '@abx-utils/internal-api-tools'

export function bootstrapInternalApi(app: express.Express) {
  createOrderQueryEndpointHandlers()

  setupInternalApi(app, createOrderQueryEndpointHandlers())
}
