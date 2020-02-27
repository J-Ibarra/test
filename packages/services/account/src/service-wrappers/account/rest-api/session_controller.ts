import aws from 'aws-sdk'
import { sign } from 'jsonwebtoken'
import moment from 'moment'
import { Body, Controller, Delete, Post, Request, Response, Route, Security, SuccessResponse } from 'tsoa'
import { Environment, localAndTestEnvironments, localTestEnvironments, getAwsRegionForEnvironment } from '@abx-types/reference-data'
import { createSessionForUser, isAccountSuspended, killSession, validateUserCredentials, authenticateMfa, hasMfaEnabled } from '../../../core'
import { Logger } from '@abx-utils/logging'
import { ValidationError } from '@abx-types/error'
import { OverloadedRequest } from '@abx-types/account'

const localDev = localAndTestEnvironments.includes(process.env.NODE_ENV as Environment)

const DEFAULT_SESSION_EXPIRY = 12

export interface LoginRequest {
  email: string
  password: string
  mfaToken?: string
}

const environmentNameRecord = {
  [Environment.e2eAws]: 'end-to-end',
  [Environment.staging]: 'stg',
  [Environment.integration]: 'int',
  [Environment.uat]: 'uat',
  [Environment.production]: 'prod',
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

@Route('sessions')
export class SessionsController extends Controller {
  @SuccessResponse('201', 'Created')
  @Response('400', 'Bad request')
  @Post()
  public async login(@Body() requestBody: LoginRequest, @Request() request: OverloadedRequest): Promise<any> {
    const { email, password, mfaToken } = requestBody
    try {
      const user = await validateUserCredentials(email, password)

      const accountSuspended: boolean = await isAccountSuspended(user.accountId)

      if (accountSuspended) {
        this.setStatus(403)
        return { message: 'Account suspended' }
      }

      const isMfaEnabledForUser = await hasMfaEnabled(user.id)

      if (isMfaEnabledForUser && !localTestEnvironments.includes(process.env.NODE_ENV as Environment)) {
        if (!mfaToken) {
          this.setStatus(403)
          return { message: 'MFA Required' }
        }

        const isVerified = await authenticateMfa(user.id, mfaToken)
        if (!isVerified) {
          this.setStatus(400)
          return { message: 'The token you have provided is invalid' }
        }
      }

      const { sessionCookie, user: updatedUser } = await createSessionForUser(user.id, DEFAULT_SESSION_EXPIRY)

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
        `appSession=${sessionCookie}; ${localDev ? '' : 'Secure;'} HttpOnly; Path=/; ${
          localDev ? '' : 'SameSite=Strict;'
        } expires=${appSessionExpires};`,
      )

      return {
        ...updatedUser,
        token: authToken,
      }
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
      `appSession='; ${localDev ? '' : 'Secure;'} HttpOnly; Path=/; SameSite=Strict; expires=Thu, 01 Jan 1970 00:00:00 UTC;`,
    )
    this.setStatus(200)
  }
}
