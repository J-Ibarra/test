import express from 'express'
import * as bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import methodOverride from 'method-override'
import { mw as requestIpMiddleware } from 'request-ip'
import { Logger } from '@abx-utils/logging'
import {
  auditMiddleware,
  configureCORS,
  RateLimiter,
  maintenanceMiddleware,
  overloadRequestWithSessionInfo,
  healthcheckMiddleware,
} from '@abx-utils/express-middleware'
import { RegisterRoutes } from './routes'

import './order_retrieval_controller'
import './fees_controller'
import './order_match_controller'
import './orders_admin_controller'
import './transaction_history_controller'
import './depth_controller'

const logger = Logger.getInstance('api', 'bootstrapRestApi')

export const ORDER_DATA_API_PORT = 3106

export function bootstrapRestApi() {
  const app = express()

  app.use(requestIpMiddleware())
  app.use(cookieParser())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())
  app.use(methodOverride())
  app.use(maintenanceMiddleware)
  app.use(healthcheckMiddleware)
  app.use(overloadRequestWithSessionInfo)
  app.all('*', auditMiddleware)

  let configureApiRateLimiting = Promise.resolve()
  configureCORS(app)

  if (process.env.NODE_ENV !== 'test') {
    logger.debug(`Starting order data server on port ${ORDER_DATA_API_PORT}...`)

    configureApiRateLimiting = new RateLimiter().configureForApp(app).then(() => logger.debug('API rate limiting configured.'))
  }

  configureApiRateLimiting.then(() => {
    RegisterRoutes(app)

    // @ts-ignore
    app.use((err, req, res, next) => {
      logger.error(`An error has ocurred while processing ${req.url!}: ${err.message}`)
      logger.error(JSON.stringify(err.stack))
      res.status(err.status || res.status || 500)
      res.json({
        error: err.message,
      })
    })
  })

  console.log(`Order Data API on port ${ORDER_DATA_API_PORT}`)
  return app.listen(ORDER_DATA_API_PORT)
}
