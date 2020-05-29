import { Session, Account } from '@abx-types/account'

export interface ValidationResult {
  success: boolean
  errorMessage?: string
}

export interface ValidationParams {
  account: Account
  session: Session
}

export type AuthenticationValidator = (params: ValidationParams) => ValidationResult
