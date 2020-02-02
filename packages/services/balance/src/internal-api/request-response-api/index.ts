import { createQueryEndpointHandlers } from './query_endpoints'
import { createChangeEndpointHandlers } from './change_endpoints'
import { setupInternalApi } from '@abx-utils/internal-api-tools'
import express from 'express'

export function bootstrapRequestResponseApiEndpoints(app: express.Express) {
  return setupInternalApi(app, createQueryEndpointHandlers().concat(createChangeEndpointHandlers()))
}
