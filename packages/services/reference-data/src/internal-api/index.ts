import { createSymbolEndpointHandlers } from './symbols'
import { createCurrencyEndpointHandlers } from './currency'
import { createBoundaryEndpointHandlers } from './boundaries'
import { createConfigEndpointHandlers } from './config'
import express from 'express'
import { setupInternalApi } from '@abx-utils/internal-api-tools'

export function bootstrapInternalApi(app: express.Express) {
  const symbolRoutes = createSymbolEndpointHandlers()
  const currencyRoutes = createCurrencyEndpointHandlers()
  const configRoutes = createConfigEndpointHandlers()
  const boundaryRoutes = createBoundaryEndpointHandlers()

  setupInternalApi(
    app,
    symbolRoutes
      .concat(currencyRoutes)
      .concat(configRoutes)
      .concat(boundaryRoutes),
  )
}
