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

  const server = app.listen(WITHDRAWAL_PROCESSOR_SERVICE_PORT)
  /** Due to intermittent 502 response on the Load balancer side, the following 2 server settings need to be made. */
  server.keepAliveTimeout = 65000 // Ensure all inactive connections are terminated by the ALB, by setting this a few seconds higher than the ALB idle timeout
  server.headersTimeout = 66000 // Ensure the headersTimeout is set higher than the keepAliveTimeout due to this nodejs regression bug: https://github.com/nodejs/node/issues/27363

  return server
}
