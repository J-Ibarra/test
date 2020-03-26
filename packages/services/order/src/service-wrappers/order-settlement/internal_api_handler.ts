import express from 'express'
import * as bodyParser from 'body-parser'
import { mw as requestIpMiddleware } from 'request-ip'
import { healthcheckMiddleware } from '@abx-utils/express-middleware'
import { setupInternalApi } from '@abx-utils/internal-api-tools'
import { SettlementEndpoints, SETTLEMENT_API_ROOT } from '@abx-service-clients/order'
import { addOrderToSettleQueue, runSettlementLogic } from './core'
import { Environment } from '@abx-types/reference-data'

export async function bootstrapInternalApi() {
  const app = express()

  app.use(requestIpMiddleware())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())
  app.use(healthcheckMiddleware)

  if (process.env.NODE_ENV !== Environment.test && process.env.NODE_ENV !== Environment.development) {
    setupInternalApi(app, [
      {
        path: SettlementEndpoints.settleOrderMatch,
        handler: async match => {
          return addOrderToSettleQueue(match)
        },
      },
    ])
  } else {
    setupInternalApi(app, [
      {
        path: SettlementEndpoints.settleOrderMatch,
        handler: async match => runSettlementLogic(match),
      },
    ])
  }

  console.log(`Settlement API on port ${SETTLEMENT_API_ROOT}`)
  const server = app.listen(SETTLEMENT_API_ROOT)
  /** Due to intermittent 502 response on the Load balancer side, the following 2 server settings need to be made. */
  server.keepAliveTimeout = 65000 // Ensure all inactive connections are terminated by the ALB, by setting this a few seconds higher than the ALB idle timeout
  server.headersTimeout = 66000 // Ensure the headersTimeout is set higher than the keepAliveTimeout due to this nodejs regression bug: https://github.com/nodejs/node/issues/27363

  return server
}
