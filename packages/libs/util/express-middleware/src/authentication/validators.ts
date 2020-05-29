import { AccountType } from '@abx-types/account'
import moment from 'moment'
import { ValidationResult, AuthenticationValidator } from './validator.model'

const successResult: ValidationResult = {
  success: true,
}

export const accountValidator: AuthenticationValidator = ({ account }) =>
  !account
    ? {
        success: false,
        errorMessage: 'Account invalid',
      }
    : successResult

export const sessionValidator: AuthenticationValidator = ({ session }) =>
  !session
    ? {
        success: false,
        errorMessage: 'Session invalid',
      }
    : successResult

export const sessionExpiryValidator: AuthenticationValidator = ({ session }) =>
  moment(session.expiry).isBefore(new Date()) || session.deactivated
    ? {
        success: false,
        errorMessage: 'Session expired',
      }
    : successResult

export const accountSuspensionValidator: AuthenticationValidator = ({ account }) =>
  account.suspended
    ? {
        success: false,
        errorMessage: 'Account suspended',
      }
    : successResult

export const operatorAccountValidator: AuthenticationValidator = ({ account }) =>
  account.type === AccountType.operator
    ? {
        success: false,
        errorMessage: 'Account not authorized',
      }
    : successResult

export const adminAccountValidator: AuthenticationValidator = ({ account }) =>
  account.type !== AccountType.admin
    ? {
        success: false,
        errorMessage: 'Account not authorized',
      }
    : successResult
