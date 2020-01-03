import express from 'express'
import * as bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import methodOverride from 'method-override'
import { mw as requestIpMiddleware } from 'request-ip'
import { Logger } from '@abx/logging'
import { auditMiddleware, configureCORS, RateLimiter, maintenanceMiddleware, overloadRequestWithSessionInfo } from '@abx/express-middleware'
import { RegisterRoutes } from './routes'

import './boundaries_controller'
import './currencies_controller'
import './feature_flags_controller'
import './symbols_controller'

const logger = Logger.getInstance('api', 'bootstrapRestApi')

export const REST_API_PORT = 3101

export function bootstrapRestApi() {
  const app = express()

  app.use(requestIpMiddleware())
  app.use(cookieParser())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())
  app.use(methodOverride())
  app.use(maintenanceMiddleware)
  app.use(overloadRequestWithSessionInfo)
  app.all('*', auditMiddleware)

  let configureApiRateLimiting = Promise.resolve()
  configureCORS(app)

  if (process.env.NODE_ENV !== 'test') {
    logger.debug(`Starting reference-data server on port ${REST_API_PORT}...`)

    configureApiRateLimiting = new RateLimiter().configureForApp(app).then(() => logger.debug('API rate limiting configured.'))
  }

  configureApiRateLimiting.then(() => {
    RegisterRoutes(app)

    // @ts-ignore
    app.use((err, req, res, next) => {
      logger.error(err)
      res.status(err.status || res.status || 500)
      res.json({
        error: err.message,
      })
    })
  })

  app.on('unhandledRejection', e => logger.error(e as any))

  console.log(`Reference Data API on port ${REST_API_PORT}`)
  return app.listen(REST_API_PORT)
}
