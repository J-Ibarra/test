import { Injectable, Inject } from '@nestjs/common'
import AuthGuard, {
  HttpRequest,
  EnrichedHttpRequest,
  User,
} from '@abx/ke-auth-lib'
import { ConfigSource, CONFIG_SOURCE_TOKEN } from '../providers'

/**
 * Defines a mechanism for validating the request session,
 * making sure the session has not expired and has been recorded in persistent storage.
 */
@Injectable()
export class RequestValidationAdapter {
  public authGuard: AuthGuard

  constructor(@Inject(CONFIG_SOURCE_TOKEN) configSource: ConfigSource) {
    this.authGuard = new AuthGuard({
      dbConfig: configSource.getExchangeDbConfig(),
      cookieCryptoParams: configSource.getCookieCryptoParams(),
      jwtConfig: configSource.getJwtConfig(),
    })
  }

  public async validateRequest(request: HttpRequest): Promise<User | null> {
    const userDetailsEnrichedRequest = await this.authGuard.enrichRequestWithUserDetails(
      request,
    )

    if (!!userDetailsEnrichedRequest['user']) {
      return (userDetailsEnrichedRequest as EnrichedHttpRequest).user
    }

    return null
  }
}
