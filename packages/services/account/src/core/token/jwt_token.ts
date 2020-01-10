import jwt, { SignOptions } from 'jsonwebtoken'
import _ from 'lodash'

import { TokenPayload, TokenVerificationResult } from './model'

export interface JWTPayload {
  app_metadata: {
    [key: string]: string
  }
}

const jwtConfig = {
  secret: Buffer.from(process.env.JWT_SECRET || 'this is the testing private key to test the jwt token', 'base64'),
  ALGO: 'HS256',
}

export function generateJWToken(payload: JWTPayload, options: SignOptions = {}): string {
  const defaultsOptions = {
    expiresIn: 12 * 60 * 60,
    algorithm: jwtConfig.ALGO,
  }

  const combinedOpts = _.merge({}, defaultsOptions, options)

  return jwt.sign(payload, jwtConfig.secret, combinedOpts)
}

/**
 * Verify the JWT token
 * @param token
 */
export function verifyJWToken(token: string): TokenVerificationResult {
  try {
    const payload = jwt.verify(token, jwtConfig.secret) as TokenPayload
    return { success: true, payload }
  } catch (e) {
    return {
      success: false,
      error: {
        type: e.name,
        message: e.message,
      },
    }
  }
}
