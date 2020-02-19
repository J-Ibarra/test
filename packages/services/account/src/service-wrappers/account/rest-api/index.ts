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

import './account_controller'
import './account_state_controller'
import './mfa_controller'
import './password_reset_controller'
import './session_controller'
import './token_controller'
import './user_controller'
import './e2e-testing/E2eTestingDataSetupController'

import { OverloadedRequest } from '@abx-types/account'
import { ACCOUNT_REST_API_PORT } from '@abx-service-clients/account'

const logger = Logger.getInstance('api', 'bootstrapRestApi')

export function bootstrapRestApi() {
  const app = express()

  app.use(requestIpMiddleware())
  app.use(cookieParser())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())
  app.use(methodOverride())
  app.use(healthcheckMiddleware)
  app.use(e2eTestingEndpointGuard)
  app.use(maintenanceMiddleware)
  app.use((request: OverloadedRequest, _: express.Response = {} as any, next: () => void = () => ({})) => {
    overloadRequestWithSessionInfo(request, undefined, next)
  })
  app.all('*', auditMiddleware)

  let configureApiRateLimiting = Promise.resolve()
  configureCORS(app)

  if (!process.env.NODE_ENV!.startsWith('test')) {
    logger.debug(`Starting account server on port ${ACCOUNT_REST_API_PORT}...`)

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

  console.log(`Account API running on port ${ACCOUNT_REST_API_PORT}`)
  return app
}
