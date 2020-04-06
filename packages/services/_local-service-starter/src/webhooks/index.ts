import * as bodyParser from 'body-parser'
import express from 'express'
import { RegisterRoutes } from './routes'

export const WEBHOOK_API_SERVICE_PORT = 3208

export async function bootstrapWebhookApiService() {

    const app = express()

    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(bodyParser.json())
  
    RegisterRoutes(app)

    app.on('unhandledRejection', e => console.error(e as any))
  
    console.log(`Webhook API running on port ${WEBHOOK_API_SERVICE_PORT}`)
  
    return app.listen(WEBHOOK_API_SERVICE_PORT)
  }