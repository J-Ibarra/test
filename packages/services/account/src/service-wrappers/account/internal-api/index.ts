import { createQueryEndpointHandlers } from './query_endpoints'
import express from 'express'
import { setupInternalApi } from '@abx-utils/internal-api-tools'
import { createChangeEndpointHandlers } from './change_endpoints'

export function bootstrapInternalApi(app: express.Express) {
  setupInternalApi(app, createQueryEndpointHandlers().concat(createChangeEndpointHandlers()))
}
