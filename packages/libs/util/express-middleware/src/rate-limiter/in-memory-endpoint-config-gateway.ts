import { EndpointConfigDataGateway, EndpointRateLimitConfig } from './endpoint-config-data-gateway'

const ONE_MINUTE = 60 * 1000

const commonLoginFlowRateLimitConfig = {
  maxRequestsAllowed: 5,
  requestWindow: ONE_MINUTE,
  rateExceededMessage: 'You have entered invalid credentials more than 5 times in less than a minute',
  skipSuccessfulRequests: true,
  keyGenerator: (request) => {
    const { clientIp } = request
    return `login-flow-${clientIp}`
  }
}

/** Prohibits users from entering wrong credentials or MFA token more than 5 times in a minute. */
const loginFlowRateLimitConfig: EndpointRateLimitConfig[] = [{
  ...commonLoginFlowRateLimitConfig,
  path: '/api/sessions'
}, {
  ...commonLoginFlowRateLimitConfig,
  path: '/api/mfa/verification'
}]

/** The {@link EndpointRateLimitConfig} for all endpoints. */
export const endpointRateLimitConfigs: EndpointRateLimitConfig[] = [...loginFlowRateLimitConfig]

/** Uses in-memory config as its datasource. */
export class InMemoryApiRateConfigGateway implements EndpointConfigDataGateway {

  public static instance = new InMemoryApiRateConfigGateway()

  private constructor() {
  }

  public getRateLimitConfigForAllEndpoints(): Promise<EndpointRateLimitConfig[]> {
    return Promise.resolve(endpointRateLimitConfigs)
  }
}
