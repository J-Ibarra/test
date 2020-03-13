import { Body, Controller, Delete, Get, Post, Query, Request, Response, Route, Security, SuccessResponse, Tags } from 'tsoa'
import { activateMfa, deactivateMfa, verifyMfa, MFA, findUserByEmail } from '../../../core'
import { OverloadedRequest } from '@abx-types/account'

interface MfaStatusResponse {
  enabled: boolean
}

@Tags('accounts')
@Route('mfa')
export class MFAController extends Controller {
  @Get()
  public async getMfaStatusForUser(@Query() email: string): Promise<MfaStatusResponse> {
    const user = await findUserByEmail(email)

    return {
      enabled: user ? !!user.mfaSecret || !!user.mfaTempSecret : false,
    }
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Post()
  public async activateMfaForUser(@Request() { user }: OverloadedRequest): Promise<Partial<MFA>> {
    const { id: userId, email } = user

    return activateMfa(userId, email)
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Delete('{token}')
  public async deactivateMfaForUser(token: string, @Request() { user }: OverloadedRequest): Promise<void> {
    const { id: userId } = user

    await deactivateMfa(userId, token)

    this.setStatus(200)
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @SuccessResponse('200', 'MFA token successfully verified')
  @Response('403', 'MFA token not verified')
  @Post('/verification')
  public async verifyMfaForUser(@Request() request: OverloadedRequest, @Body() requestBody: { token: string }): Promise<any> {
    const {
      user: { id },
    } = request
    const { token } = requestBody
    if (!token) {
      this.setStatus(403)
      return
    }

    try {
      await verifyMfa(id, token)
      this.setStatus(200)
    } catch (error) {
      this.setStatus(403)

      return {
        message: error.message,
      }
    }
  }
}
