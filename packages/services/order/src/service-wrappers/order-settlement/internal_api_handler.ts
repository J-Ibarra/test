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
  return app.listen(SETTLEMENT_API_ROOT)
}
