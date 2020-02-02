import { createQueryEndpointHandlers } from './query_endpoints'
import express from 'express'
import { setupInternalApi } from '@abx-utils/internal-api-tools'

export function bootstrapInternalApi(app: express.Express) {
  setupInternalApi(app, createQueryEndpointHandlers())
}
