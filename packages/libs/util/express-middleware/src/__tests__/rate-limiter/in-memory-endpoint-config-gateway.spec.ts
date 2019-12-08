import { expect } from 'chai'
import { InMemoryApiRateConfigGateway } from '../../rate-limiter/in-memory-endpoint-config-gateway'

describe('InMemoryApiRateConfigGateway', () => {
  it('should return the config for all configured endpoints', async () => {
    const config = await InMemoryApiRateConfigGateway.instance.getRateLimitConfigForAllEndpoints()

    expect(config).to.have.property('length', 2)
    expect(config[0]).to.have.property('path', '/api/sessions')
    expect(config[1]).to.have.property('path', '/api/mfa/verification')
  })
})
