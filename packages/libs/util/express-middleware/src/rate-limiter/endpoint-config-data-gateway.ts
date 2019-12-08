/** The blueprint for defining API rate limiting for a specific endpoint. */
export interface EndpointRateLimitConfig {
  /** The path to the endpoint. */
  path: string,
  /** The number of requests allowed before the access is blocked. */
  maxRequestsAllowed: number,
  /** The amount of time (in milliseconds) which needs to pass before the recorded requests are reset. */
  requestWindow: number,
  /** The message to display when the threshold is exceeded. */
  rateExceededMessage: string
  /** If true, successful requests will be skipped. */
  skipSuccessfulRequests?: boolean,
  /** Defines a custom key generator receiving the incoming request as input. */
  keyGenerator?: (request: any) => string
}

/** 
 * A service for fetching {@link EndpointRateLimitConfig} for all rate-limited endpoints.
 * Allows for different implementations based on the config datasource (i.e. in-memory/database).
 */
export interface EndpointConfigDataGateway {

  /** Gets the configuration for all rate-limited endpoints */
  getRateLimitConfigForAllEndpoints(): Promise<EndpointRateLimitConfig[]>
}
