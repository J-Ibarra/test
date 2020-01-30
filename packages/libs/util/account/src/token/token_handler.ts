export interface TokenClaims {
  accountId: string
}

export interface TokenVerificationResult {
  success: boolean
  claims?: TokenClaims
  error?: {
    type: string
    message: string
  }
}

export interface AuthToken {
  token: string
  metadata: {
    expiry: Date
  }
}

export interface TokenHandler {
  generateToken(accountId: string): AuthToken

  verifyToken(token: string): TokenVerificationResult
}
