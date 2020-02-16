import { OverloadedRequest, AccountType } from '@abx-types/account'
import { JwtTokenHandler } from '@abx-utils/account'
import { Logger } from '@abx-utils/logging'

const logger = Logger.getInstance('express-middleware', 'authentication-middleware')

export async function expressAuthentication(request: OverloadedRequest | any, securityName: string, _: string[]) {
  const { user } = request

  if (securityName === 'cookieAuth') {
    const { session, account } = request

    if (!session || !account || new Date(session.expiry) < new Date() || session.deactivated) {
      logger.warn('Session invalid')
      return Promise.reject({ message: 'Session invalid' })
    }

    if (account.suspended) {
      logger.warn('Account suspended')
      return Promise.reject({ message: 'Account suspended' })
    }

    if (account.type === AccountType.operator) {
      logger.warn('Account not authorized')
      return Promise.reject({ message: 'Account not authorized' })
    }

    return user
  } else if (securityName === 'adminAuth') {
    const { account } = request

    if (account && account.type !== AccountType.admin) {
      logger.warn('Account not authorized')
      return Promise.reject({ message: 'Account not authorized' })
    }
  } else if (securityName === 'tokenAuth') {
    return runTokenValidation(request)
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
