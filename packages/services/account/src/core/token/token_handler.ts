import { AuthToken, TokenVerificationResult } from './model'

export interface TokenHandler {
  generateToken(accountId: string): AuthToken

  verifyToken(token: string): TokenVerificationResult
}
