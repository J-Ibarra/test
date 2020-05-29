import { OverloadedRequest } from '@abx-types/account'
import { JwtTokenHandler } from '@abx-utils/account'
import { Logger } from '@abx-utils/logging'
import { runValidationPipe, adminAuthValidators, cookieValidators } from './validation_pipes'

const logger = Logger.getInstance('express-middleware', 'authentication-middleware')

export async function expressAuthentication(request: OverloadedRequest | any, securityName: string, _: string[]) {
  const { user } = request
  const { session, account } = request

  if (securityName === 'cookieAuth') {
    const { success, errorMessage } = runValidationPipe({ session, account }, cookieValidators)

    if (!success) {
      logger.warn(errorMessage)
      return Promise.reject({ message: errorMessage })
    }

    return user
  } else if (securityName === 'adminAuth') {
    const { success, errorMessage } = runValidationPipe({ session, account }, adminAuthValidators)

    if (!success) {
      logger.warn(errorMessage)
      return Promise.reject({ message: errorMessage })
    }
  } else if (securityName === 'tokenAuth') {
    return runTokenValidation(request)
  } else {
    logger.warn('Security name not provided')
    return Promise.reject({ message: 'Authorization not present' })
  }
}

const runTokenValidation = (request: OverloadedRequest | any): Promise<void> => {
  const authorizationHeader = request.header('Authorization')

  if (!authorizationHeader) {
    logger.warn('Authorization header not present')
    return Promise.reject({ message: 'Authorization header not present' })
  }

  const tokenVerificationResult = new JwtTokenHandler().verifyToken(authorizationHeader)

  if (!tokenVerificationResult.success) {
    logger.warn('Not authorized.')
    return Promise.reject({ message: 'Not authorized' })
  }

  return Promise.resolve()
}
