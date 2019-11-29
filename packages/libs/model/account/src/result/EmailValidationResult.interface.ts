import { EmailValidationError } from '../error/EmailValidationError.enum'

/** The entity used as an email validation result container.  */
export interface EmailValidationResult {
  /** True when email valid. */
  isValid: boolean
  /** Present if email not valid */
  error?: EmailValidationError
}
