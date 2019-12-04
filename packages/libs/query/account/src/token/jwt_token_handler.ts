import * as jwt from 'jsonwebtoken'
import moment from 'moment'

const jwtSecret = process.env.JWT_SECRET || 'test'

import { AuthToken, TokenClaims, TokenHandler, TokenVerificationResult } from './token_handler'

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
      jwtSecret,
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
      const tokenClaims = jwt.verify(token, jwtSecret) as TokenClaims

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
