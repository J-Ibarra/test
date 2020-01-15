import * as jwt from 'jsonwebtoken'
import moment from 'moment'

import { getEnvironmentConfig } from '@abx/db-connection-utils'
import { TokenHandler } from './token_handler'
import { AuthToken, TokenClaims, TokenVerificationResult } from './model'

export const JWT_GENERATION_CONFIG: jwt.SignOptions = {
  algorithm: 'HS256',
}

export class JwtTokenHandler implements TokenHandler {
  public generateToken(accountId: string): AuthToken {
    const expiryMoment = moment().add(1, 'years')

    const token = jwt.sign(
      {
        accountId,
        exp: expiryMoment.unix(),
      },
      getEnvironmentConfig().jwtSecret,
      JWT_GENERATION_CONFIG,
    )

    return {
      token,
      metadata: {
        expiry: expiryMoment.toDate(),
      },
    }
  }

  public verifyToken(token: string): TokenVerificationResult {
    try {
      const tokenClaims = jwt.verify(token, getEnvironmentConfig().jwtSecret) as TokenClaims

      return { success: true, claims: tokenClaims }
    } catch ({ name, message }) {
      return {
        success: false,
        error: {
          type: name,
          message,
        },
      }
    }
  }
}
