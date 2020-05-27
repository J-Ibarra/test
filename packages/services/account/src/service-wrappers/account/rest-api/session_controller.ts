import aws from 'aws-sdk'
import { sign } from 'jsonwebtoken'
import moment from 'moment'
import { Body, Controller, Delete, Post, Request, Response, Route, Security, SuccessResponse, Tags } from 'tsoa'
import { Environment, localAndTestEnvironments, getAwsRegionForEnvironment } from '@abx-types/reference-data'
import { createSessionForUser, isAccountSuspended, killSession, validateUserCredentials, authenticateMfa, hasMfaEnabled, saveAndSendVerificationCodeFromEmail, validateUserPhone, findUserPhoneDetailsByUserId, validatePassword, findSessionByUserId, findUserById } from '../../../core'
import { Logger } from '@abx-utils/logging'
import { ValidationError } from '@abx-types/error'
import { OverloadedRequest, UserPublicView } from '@abx-types/account'
import { createWalletAddressesForNewAccount } from '@abx-service-clients/deposit'

const DEFAULT_SESSION_EXPIRY = 12

interface LoginDeviceRequest {
  pinCode: string
}

export interface LoginRequest {
  email: string
  password: string
  mfaToken?: string
  uuidPhone?: string
}

export interface LoginValidationResult {
	isSuccess: boolean
	errorMessage?: string
	errorStatusCode?: any
}

const environmentNameRecord = {
  [Environment.e2eAws]: 'end-to-end',
  [Environment.staging]: 'stg',
  [Environment.integration]: 'int',
  [Environment.uat]: 'uat',
  [Environment.production]: 'prod',
  [Environment.yieldUat]: 'yield',
}

const logger = Logger.getInstance('api', 'SessionsController')

async function getJwt() { 
  const secretsManager = new aws.SecretsManager({
    apiVersion: '2017-10-17',
    region: getAwsRegionForEnvironment(process.env.NODE_ENV as Environment),
  })

  return new Promise((resolve, reject) => {
    secretsManager.getSecretValue(
      {
        SecretId: `kbe-${environmentNameRecord[process.env.NODE_ENV!]}-secrets`,
      },
      (err, result) => {
        if (err) {
          logger.error(`Error encountered trying to retrieve kbe-${process.env.NODE_ENV}-secrets: ${JSON.stringify(err)}`)
          return reject(err)
        }

        logger.debug('Successfully retrieved auth token')

        return resolve(JSON.parse(result.SecretString ? result.SecretString : '').JWT_SECRET)
      },
    )
  })
}

@Tags('accounts')
@Route('sessions')
export class SessionsController extends Controller {
  @Post('{userId}/device')
  public async loginFromDevice(userId: string, @Body() { pinCode }: LoginDeviceRequest, @Request() request: OverloadedRequest): Promise<{ message: string } | void> {
    try {
      const user = await findUserById(userId)
      if (!user){
        this.setStatus(404)
        return { message: 'User not found'}
      }
      const userPhoneDetails = await findUserPhoneDetailsByUserId(userId)
      const pinCodeHash:string | any = userPhoneDetails?.pinCodeHash
      const isCurrentPinCodeValid = await validatePassword(pinCode, pinCodeHash)
      
      if (!isCurrentPinCodeValid){
        throw new ValidationError('Back-up PIN is incorrect')
      }
      const session = await findSessionByUserId(userId)
      if (!moment().isBefore(session!.expiry) || session!.deactivated) {
        const resContent = await this.contentResponseLogin(userId,user!.accountId,request)
        return resContent
      }
    } catch (e) {
      this.setStatus(400)
      return { message: e.message }
    }
  }
  
  @Tags('authentication')
  @SuccessResponse('201', 'Created')
  @Response('400', 'Bad request')
  @Post()
  public async login(@Body() requestBody: LoginRequest, @Request() request: OverloadedRequest): Promise<any> {
    const { email, password, mfaToken, uuidPhone } = requestBody
    try {
      const user = await validateUserCredentials(email, password)

      const loginValidationResult = await this.runLoginValidation(user, uuidPhone, mfaToken)

      if (!loginValidationResult.isSuccess) {
        this.setStatus(loginValidationResult.errorStatusCode)
          return { message: loginValidationResult.errorMessage }
      }
      
      const resContent = await this.contentResponseLogin(user.id,user.accountId,request)
      return resContent
    } catch (err) {
      this.setStatus(err.status || 400)

      if (err instanceof ValidationError) {
        return { message: 'Email and/or password are incorrect' }
      }

      return {
        message: err.message,
      }
    }
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Delete()
  public async removeUsersSession(@Request() { session: { id } }: OverloadedRequest): Promise<void> {
    await killSession(id)

    this.setHeader(
      'Set-Cookie',
      `appSession='; ${this.isLocalDev() ? '' : 'Secure;'} HttpOnly; Path=/; SameSite=Strict; expires=Thu, 01 Jan 1970 00:00:00 UTC;`,
    )
    this.setStatus(200)
  }

  private isLocalDev() {
    return localAndTestEnvironments.includes(process.env.NODE_ENV as Environment)
  }

  private async runLoginValidation(user: UserPublicView, uuidPhone: any, mfaToken: any): Promise<LoginValidationResult> {
    const accountSuspended: boolean = await isAccountSuspended(user.accountId)

    if (accountSuspended) {
      return { 
        errorMessage: 'Account suspended',
        isSuccess: false,
        errorStatusCode: 403,
      }
    }

    let uuidPhoneMatches: any = null
    if (uuidPhone) {   
      uuidPhoneMatches = await validateUserPhone(user.id, uuidPhone)
    }

    if (uuidPhoneMatches === false) {
      await saveAndSendVerificationCodeFromEmail(user)
      return {
        errorMessage: 'Register Device Required',
        isSuccess: false,
        errorStatusCode: 403,
      }
    }

    const isMfaEnabledForUser = await hasMfaEnabled(user.id)

    if (isMfaEnabledForUser && !this.isLocalDev() && !uuidPhone) {
      if (!mfaToken) {
        return {
          errorMessage: 'MFA Required',
          isSuccess: false,
          errorStatusCode: 403,
        }
      }

      const isVerified = await authenticateMfa(user.id, mfaToken)
      if (!isVerified) {
        return {
          errorMessage: 'The token you have provided is invalid',
          isSuccess: false,
          errorStatusCode: 400,
        }
      }
    }

    return { 
      errorMessage: 'Success',
      isSuccess: true,
      errorStatusCode: 200
    }
  }

  private async contentResponseLogin(userId: string,account: string, request: OverloadedRequest): Promise<any> {
    const { sessionCookie, user: updatedUser } = await createSessionForUser(userId, DEFAULT_SESSION_EXPIRY)

    const ip = (request as any).clientIp
    let authToken: string = ''

    if (!!environmentNameRecord[process.env.NODE_ENV!]) {
      const jwt = await getJwt()
      authToken = sign({}, `${ip}-${jwt}`)
    }

    const appSessionExpires: Date = moment()
      .add(DEFAULT_SESSION_EXPIRY, 'hours')
      .toDate()

    this.setHeader(
      'Set-Cookie',
      `appSession=${sessionCookie}; ${this.isLocalDev() ? '' : 'Secure;'} HttpOnly; Path=/; ${
        this.isLocalDev() ? '' : 'SameSite=Strict;'
      } expires=${appSessionExpires};`,
    )

    process.nextTick(() => createWalletAddressesForNewAccount(account))

    return {
      ...updatedUser,
      token: authToken
    }
  }
}
