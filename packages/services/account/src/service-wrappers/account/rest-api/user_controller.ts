import { Controller, Patch, Request, Route, Security, Tags } from 'tsoa'
import { killSession, updateUser } from '../../../core'
import { OverloadedRequest } from '@abx-types/account'

@Tags('accounts')
@Route('users')
export class UserStateController extends Controller {
  @Security('cookieAuth')
  @Security('tokenAuth')
  @Patch('activate')
  public async activateUser(@Request() request: OverloadedRequest): Promise<void> {
    const { id, activated } = request.user
    await killSession(request.session.id)

    if (!activated) {
      await updateUser({ id, activated: true })
    }
  }
}
