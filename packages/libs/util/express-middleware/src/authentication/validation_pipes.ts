import { AuthenticationValidator, ValidationParams, ValidationResult } from './validator.model'
import {
  accountValidator,
  sessionValidator,
  sessionExpiryValidator,
  accountSuspensionValidator,
  operatorAccountValidator,
  adminAccountValidator,
} from './validators'

export const cookieValidators = [accountValidator, sessionValidator, sessionExpiryValidator, accountSuspensionValidator, operatorAccountValidator]

export const adminAuthValidators = [accountValidator, sessionValidator, sessionExpiryValidator, accountSuspensionValidator, adminAccountValidator]

export function runValidationPipe(params: ValidationParams, validators: AuthenticationValidator[]): ValidationResult {
  for (let validatorFn of validators) {
    const result = validatorFn(params)

    if (!result.success) {
      return result
    }
  }

  return { success: true }
}
