import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RequestValidationAdapter } from './RequestValidationAdapter'
import { AccountType } from '@abx/ke-auth-lib'

/**
 * Defines the endpoint guard mechanism which uses the session cookie or JWT
 * passed in with the request to identify if the user has sufficient privileges to access
 * a given endpoint.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly requestValidationAdapter: RequestValidationAdapter,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler())
    if (!roles) {
      return true
    }

    const request = context.switchToHttp().getRequest()

    const requestWithCookies = {
      ...request,
      cookies: this.parseCookiesHeader((request.raw.headers || {}).cookie),
    }

    const user = await this.requestValidationAdapter.validateRequest(
      requestWithCookies,
    )

    context.switchToHttp().getRequest().user = user

    return (
      !!user &&
      (user.accountType === AccountType.admin ||
        roles.includes(user.accountType!))
    )
  }

  private parseCookiesHeader(
    stringifiedCookies: string = '',
  ): Record<string, any> {
    const allCookiePairs = stringifiedCookies.split('; ')

    return allCookiePairs.reduce((cookiesAccumulator, cookiePairString) => {
      const [key, value] = cookiePairString.split('=')

      return {
        ...cookiesAccumulator,
        [key]: value,
      }
    }, {})
  }
}
