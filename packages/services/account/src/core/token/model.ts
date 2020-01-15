export interface TokenPayload {
  app_metadata: {
    [key: string]: string
  }
}
export interface TokenVerificationResult {
  success: boolean
  payload?: TokenPayload
  claims?: TokenClaims
  error?: {
    type: string
    message: string
  }
}

export interface TokenClaims {
  accountId: string
}

export interface AuthToken {
  token: string
  metadata: {
    expiry: Date
  }
}
