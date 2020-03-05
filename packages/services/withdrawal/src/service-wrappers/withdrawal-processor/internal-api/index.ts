import { createRequestResponseEndpointHandlers } from './request_response_endpoints_handler'
import { bootstrapQueueDrivenApi } from './queue_driven_api_handler'
import express from 'express'
import { mw as requestIpMiddleware } from 'request-ip'
import * as bodyParser from 'body-parser'
import { healthcheckMiddleware } from '@abx-utils/express-middleware'

import { setupInternalApi } from '@abx-utils/internal-api-tools'
import { WITHDRAWAL_PROCESSOR_SERVICE_PORT } from '@abx-service-clients/withdrawal'

export function bootstrapInternalApi() {
  const app = express()

  app.use(requestIpMiddleware())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())
  app.use(healthcheckMiddleware)

  setupInternalApi(app, createRequestResponseEndpointHandlers())
  bootstrapQueueDrivenApi()

  return app.listen(WITHDRAWAL_PROCESSOR_SERVICE_PORT)
}
