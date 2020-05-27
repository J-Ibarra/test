import { Controller, Patch, Request, Route, Security } from 'tsoa'
import { killSession, updateUser } from '../../../core'
import { OverloadedRequest } from '@abx-types/account'
import { Logger } from '@abx-utils/logging'

const logger = Logger.getInstance('account', 'user_controller')
logger.debug(`user ${logger}`)

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
