import { createQueryEndpointHandlers } from './query_endpoints'
import { setupInternalApi } from '@abx-utils/internal-api-tools'
import express from 'express'

export function bootstrapInternalApi(app: express.Express) {
  setupInternalApi(app, createQueryEndpointHandlers())
}
