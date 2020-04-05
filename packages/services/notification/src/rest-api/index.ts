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
  e2eTestingEndpointGuard,
} from '@abx-utils/express-middleware'
import { RegisterRoutes } from './routes'

import './E2eTestingController'
import { NOTIFICATION_API_PORT } from '@abx-service-clients/notification'

const logger = Logger.getInstance('api', 'bootstrapRestApi')

export function bootstrapRestApi() {
  const app = express()

  app.use(requestIpMiddleware())
  app.use(cookieParser())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())
  app.use(methodOverride())
  app.use(maintenanceMiddleware)
  app.use(healthcheckMiddleware)
  app.use(e2eTestingEndpointGuard)
  app.use(overloadRequestWithSessionInfo)
  app.all('*', auditMiddleware)

  let configureApiRateLimiting = Promise.resolve()
  configureCORS(app)

  if (process.env.NODE_ENV !== 'test') {
    logger.debug(`Starting order data server on port ${NOTIFICATION_API_PORT}...`)

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

  console.log(`Notification API on port ${NOTIFICATION_API_PORT}`)
  const server = app.listen(NOTIFICATION_API_PORT)
  /** Due to intermittent 502 response on the Load balancer side, the following 2 server settings need to be made. */
  server.keepAliveTimeout = 65000 // Ensure all inactive connections are terminated by the ALB, by setting this a few seconds higher than the ALB idle timeout
  server.headersTimeout = 66000 // Ensure the headersTimeout is set higher than the keepAliveTimeout due to this nodejs regression bug: https://github.com/nodejs/node/issues/27363

  return server
}
