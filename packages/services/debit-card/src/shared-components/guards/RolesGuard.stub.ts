import { CanActivate, ExecutionContext } from '@nestjs/common'
import { TestUserDetailsProvider } from '../providers/user-details/TestUserDetailsProvider'

/** The stub used for integration tests. */
export class RolesGuardStub implements CanActivate {
  constructor(private testUserDetailsProvider: TestUserDetailsProvider) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    request['user'] = this.testUserDetailsProvider.getUserDetails()

    return true
  }
}
