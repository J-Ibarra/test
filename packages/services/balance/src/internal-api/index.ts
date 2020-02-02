import { bootstrapQueueDrivenApi } from './queue-driven-api'
import { bootstrapRequestResponseApiEndpoints } from './request-response-api'
import express from 'express'

export function bootstrapInternalApi(app: express.Express) {
  bootstrapQueueDrivenApi()
  bootstrapRequestResponseApiEndpoints(app)
}
