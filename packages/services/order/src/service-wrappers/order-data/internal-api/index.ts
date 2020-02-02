import { createOrderQueryEndpointHandlers } from './order'
import { createOrderMatchQueryEndpointHandlers } from './order_match'
import express from 'express'
import { setupInternalApi } from '@abx-utils/internal-api-tools'

export function bootstrapInternalApi(app: express.Express) {
  createOrderQueryEndpointHandlers()
  createOrderMatchQueryEndpointHandlers()

  setupInternalApi(app, createOrderQueryEndpointHandlers().concat(createOrderMatchQueryEndpointHandlers()))
}
