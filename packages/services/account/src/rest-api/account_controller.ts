import { Body, Controller, Get, Patch, Post, Query, Request, Response, Route, Security, SuccessResponse } from 'tsoa'
import {
  createAccountAndPrepareWelcomeEmail,
  createResetPasswordConfirmationEmailContent,
  findAccountById,
  findAllUsersForHin,
  // generateWalletAddresses,
  sendReferralCodeEmail,
  sendVerificationEmail,
  verifyUserAccount,
  getBankDetailsForAccount,
  saveBankDetails,
  changePassword,
  getKycVerifiedAccountDetails,
  recordKycCheckTriggered,
} from '../core'
import { AccountType, CreateAccountRequest, PersonalBankDetails, UserPublicView } from '@abx-types/account'
import { Logger } from '@abx/logging'
import { ValidationError } from '@abx-types/error'
import { OverloadedRequest } from '@abx-types/account'
import { createEmail } from '@abx-service-clients/notification'

export interface VerifyAccountRequest {
  userToken?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

@Route()
export class AccountsController extends Controller {
  private logger = Logger.getInstance('api', 'AccountsController')

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('accounts/bank-details')
  public async getBankDetails(@Request() request: OverloadedRequest) {
    return getBankDetailsForAccount(request.account!.id)
  }

  @SuccessResponse(200)
  @Security('cookieAuth')
  @Security('tokenAuth')
  @Post('accounts/bank-details')
  public async saveBankDetails(@Request() { account }: OverloadedRequest, @Body() bankDetails: PersonalBankDetails) {
    return saveBankDetails(account!.id, bankDetails)
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Patch('accounts/password')
  public async changePassword(
    @Request() request: OverloadedRequest,
    @Body() { currentPassword, newPassword }: ChangePasswordRequest,
  ): Promise<{ message: string } | void> {
    try {
      const updatedUser = await changePassword({
        accountId: request.account!.id,
        currentPassword,
        newPassword,
      })

      const resetPasswordConfirmationDetails = await createResetPasswordConfirmationEmailContent(updatedUser)

      this.logger.debug(`Sending reset password confirmation to ${updatedUser.email}.`)
      await createEmail(resetPasswordConfirmationDetails)
    } catch (error) {
      this.setStatus(400)
      return { message: error.message }
    }
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('accounts/kyc-details')
  public async getKycUserDetails(@Request() { account }: OverloadedRequest) {
    return getKycVerifiedAccountDetails(account!.id)
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Response('403', 'Unauthorized')
  @Get('accounts/{id}')
  public async getAccount(@Request() request: OverloadedRequest, id: string) {
    if (request.account!.id !== id && request.account!.type !== AccountType.admin) {
      this.setStatus(403)
      return { message: 'Unauthorized' }
    }

    return findAccountById(id)
  }

  @SuccessResponse('201', 'Created')
  @Response('409', 'Account email already taken')
  @Response('400', 'Invalid request body')
  @Post('accounts')
  public async createIndividualAccount(@Body() requestBody: CreateAccountRequest) {
    if (process.env.REGISTRATION_DISABLED) {
      return {
        message: 'Registrations are currently disabled',
      }
    }

    try {
      this.logger.debug(`Creating account for ${requestBody.email}`)
      const { account, welcomeEmailContent } = await createAccountAndPrepareWelcomeEmail(requestBody, AccountType.individual)

      // await generateWalletAddresses(account.id)
      this.logger.debug(`Generated hot-wallet addresses for user ${requestBody.email}`)

      const user = account.users![0]

      this.logger.debug(`Sending welcome email for ${requestBody.email}`)
      await createEmail(welcomeEmailContent)
      this.logger.debug(`Welcome email sent for ${requestBody.email}`)

      this.logger.debug(`Sending referral email for ${requestBody.email}`)
      await sendReferralCodeEmail(user, account.hin!)
      this.logger.debug(`Referral email sent for ${requestBody.email}`)

      this.setStatus(201)

      return account
    } catch (error) {
      this.logger.error(`An error ocurred creating user account for ${requestBody.email}: ${error.message}`)
      if (error instanceof ValidationError) {
        this.setStatus(error.status as number)

        return { message: error.message }
      }

      this.setStatus(400)
      return {
        message: 'An error has ocurred trying to process your sign-up request.',
        context: error.message,
      }
    }
  }

  @SuccessResponse('200', 'Account verification email successfully sent')
  @Security('cookieAuth')
  @Security('tokenAuth')
  @Post('accounts/verification/generation')
  public async sendUserVerificationEmail(@Request() { user }: OverloadedRequest) {
    return sendVerificationEmail(user)
  }

  @SuccessResponse('200', 'Account verified')
  @Post('accounts/verification')
  public async verifyUserAccount(@Body() { userToken }: VerifyAccountRequest) {
    try {
      this.setStatus(200)
      return await verifyUserAccount(userToken!)
    } catch (error) {
      this.setStatus(400)
      return { message: error.message }
    }
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Post('accounts/kyc-form-submission')
  public async recordKycFormSubmission(@Request() { account }: OverloadedRequest) {
    return recordKycCheckTriggered(account!.id)
  }

  @Security('adminAuth')
  @Get('admin/accounts/search')
  public async searchForUserAccount(@Query() hin: string): Promise<UserPublicView[]> {
    return findAllUsersForHin(hin)
  }
}
