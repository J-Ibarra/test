import {
  TerminusEndpoint,
  TerminusOptionsFactory,
  TerminusModuleOptions,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus/dist'
import { Injectable } from '@nestjs/common'

/**
 * Defines a healthcheck service pinging the Database
 * + optionally any other 3rd party services we have integrated with).
 * In case of any of {@link HealthIndicator} failure a 503 response will be returned.
 */
@Injectable()
export class TerminusHealthCheckService implements TerminusOptionsFactory {
  constructor(private readonly dbHealthIndicator: TypeOrmHealthIndicator) {}

  createTerminusOptions(): TerminusModuleOptions {
    const healthEndpoint: TerminusEndpoint = {
      url: '/api/debit-cards/healthcheck',
      healthIndicators: [
        async () => this.dbHealthIndicator.pingCheck('database'),
      ],
    }

    return {
      endpoints: [healthEndpoint],
    }
  }
}
