import { Express } from 'express'
import RateLimit from 'express-rate-limit'
import { recordCustomEvent } from 'newrelic'
import RedisStore from 'rate-limit-redis'
import { getVanillaRedisClient } from '@abx/db-connection-utils'
import { EndpointConfigDataGateway } from './endpoint-config-data-gateway'
import { InMemoryApiRateConfigGateway } from './in-memory-endpoint-config-gateway'

const DEFAULT_RATE_LIMIT_EXCEEDED_STATUS_CODE = 429

/** Creates a custom payload for the rate-exceeded response payload. */
const generateMaxLimitExceededRequestHandler = (requestWindow, message) => (_, res) => {
  res.status(DEFAULT_RATE_LIMIT_EXCEEDED_STATUS_CODE).send({
    requestWindow,
    message
  })
}

/**
 * Defines the API request limiting mechanism, putting an upper bound
 * on the number of requests allowed per user/account for specific endpoints.
 */
export class RateLimiter {

  private static readonly redisStore = new RedisStore({
    client: getVanillaRedisClient()
  })

  constructor(private endpointConfigGateway: EndpointConfigDataGateway = InMemoryApiRateConfigGateway.instance) {
  }

  public async configureForApp(app: Express): Promise<void> {
    (await this.endpointConfigGateway.getRateLimitConfigForAllEndpoints()).forEach(endpointConfig =>
      app.use(
        endpointConfig.path,
        new RateLimit({
          store: RateLimiter.redisStore,
          max: endpointConfig.maxRequestsAllowed,
          windowMs: endpointConfig.requestWindow,
          handler: generateMaxLimitExceededRequestHandler(endpointConfig.requestWindow, endpointConfig.rateExceededMessage),
          skipSuccessfulRequests: endpointConfig.skipSuccessfulRequests,
          keyGenerator: endpointConfig.keyGenerator,
          onLimitReached: (req) => {
            recordCustomEvent('event_rate_limit_reached', {
              ip: req.clientIp,
            })
          },
          skip: (request) => {
            return request.method === 'OPTIONS'
          }
        })
      )
    )
  }
}
