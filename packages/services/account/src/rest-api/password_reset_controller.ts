import { Body, Controller, Get, Post, Put, Query, Response, Route, SuccessResponse } from 'tsoa'

import { createAndSaveNewPassword, createResetPasswordConfirmationEmailContent, resetPasswordRequired, validateResetPasswordToken } from '../core'
import { Logger } from '@abx-utils/logging'
import { createEmail } from '@abx-service-clients/notification'
import { UserPublicView } from '@abx-types/account'

interface SendResetPasswordEmailRequest {
  email: string
}

interface ResetPasswordRequest {
  userId: string
  newPassword: string
  newPasswordRetyped: string
  token: string
}

const genericPasswordResetResponse = { message: 'If your email is in our system, you will receive a password recovery link to your inbox shortly.' }

@SuccessResponse('200')
@Response('400', 'Bad request')
@Route('reset-password')
export class ResetPasswordController extends Controller {
  private logger = Logger.getInstance('api', 'ResetPasswordController')

  @SuccessResponse('200')
  @Post()
  public async sendResetPasswordEmail(@Body() requestBody: SendResetPasswordEmailRequest): Promise<{ message: string } | void> {
    try {
      const resetPasswordEmailMarkup = await resetPasswordRequired(requestBody.email)
      await createEmail(resetPasswordEmailMarkup)
      return genericPasswordResetResponse
    } catch (error) {
      if (error.status === 400) {
        this.setStatus(200)
        return genericPasswordResetResponse
      }
      this.setStatus(error.status)
      return {
        message: error.status as string,
      }
    }
  }

  @SuccessResponse('200', 'valid')
  @Get()
  public async validateToken(@Query() userId: string, @Query() token: string): Promise<{ message: string } | void> {
    try {
      const validationResult = await validateResetPasswordToken(userId, token)
      if (!validationResult) {
        this.setStatus(400)
        return {
          message: 'Invalid token',
        }
      }
      this.setStatus(200)
    } catch (error) {
      this.setStatus(error.status || 400)
      return {
        message: error.message as string,
      }
    }
  }

  @SuccessResponse('200')
  @Response('400', 'Bad request')
  @Put()
  public async resetPassword(@Body() requestBody: ResetPasswordRequest): Promise<{ message: string } | UserPublicView | void> {
    const { userId, token, newPassword, newPasswordRetyped } = requestBody

    try {
      const tokenValidation = await validateResetPasswordToken(userId, token)
      if (tokenValidation) {
        const userData = await createAndSaveNewPassword(userId, newPassword, newPasswordRetyped)

        this.logger.debug(`Updated password for ${userData.email}.`)

        const resetPasswordConfirmationDetails = await createResetPasswordConfirmationEmailContent(userData)

        this.logger.debug(`Sending reset password confirmation to ${userData.email}.`)

        createEmail(resetPasswordConfirmationDetails)

        this.setStatus(200)
        return userData
      }
    } catch (error) {
      this.setStatus(error.status || 400)
      return {
        message: error.message as string,
      }
    }
  }
}
