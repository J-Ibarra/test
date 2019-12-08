import { Express } from 'express'
import sinon from 'sinon'

import { EndpointConfigDataGateway, EndpointRateLimitConfig } from '../../rate-limiter/endpoint-config-data-gateway'
import { RateLimiter } from '../../rate-limiter/index'

describe('rate-limiter', () => {
  const testRateLimitConfig: EndpointRateLimitConfig[] = [
    {
      path: 'test-path-1',
      maxRequestsAllowed: 5,
      requestWindow: 1000,
      rateExceededMessage: 'rate exceeded',
      skipSuccessfulRequests: true,
    },
    {
      path: 'test-path-2',
      maxRequestsAllowed: 5,
      requestWindow: 1000,
      rateExceededMessage: 'rate exceeded',
      skipSuccessfulRequests: true,
    },
  ]

  const testEndpointConfigDataGateway: EndpointConfigDataGateway = {
    getRateLimitConfigForAllEndpoints: () => Promise.resolve(testRateLimitConfig),
  }

  const rateLimiter = new RateLimiter(testEndpointConfigDataGateway)

  afterEach(() => {
    sinon.restore()
  })

  it('should configure rate limits for all endpoints', async () => {
    const use = sinon.spy()

    const app: Express = {
      use,
    } as any

    await rateLimiter.configureForApp(app)

    sinon.assert.calledTwice(use)
    sinon.assert.calledWith(use, testRateLimitConfig[0].path)
    sinon.assert.calledWith(use, testRateLimitConfig[1].path)
  })
})
