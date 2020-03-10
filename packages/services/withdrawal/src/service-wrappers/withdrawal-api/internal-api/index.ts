import { createRequestResponseEndpointHandlers } from './internal_endpoints_configuration'
import express from 'express'
import { setupInternalApi } from '@abx-utils/internal-api-tools'

export function bootstrapInternalApi(app: express.Express) {
  setupInternalApi(app, createRequestResponseEndpointHandlers())
}
