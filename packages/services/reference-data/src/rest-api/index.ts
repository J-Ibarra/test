import express from 'express'
import * as bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import methodOverride from 'method-override'
import { mw as requestIpMiddleware } from 'request-ip'
import { Logger } from '@abx/logging'

export function bootstrapRestApi() {
  const app = express()

  app.use(requestIpMiddleware())
  app.use(cookieParser())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())
  app.use(methodOverride())

  const logger = Logger.getInstance('api', 'bootstrap')

  app.on('unhandledRejection', e => logger.error(e as any))

  console.log('Reference Data API on port 3003')
  app.listen(3003)
}
