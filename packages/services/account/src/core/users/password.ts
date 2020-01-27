import { Logger } from '@abx-utils/logging'
import { ValidationError } from '@abx-types/error'
import { generateJWToken, verifyJWToken } from '../token/jwt_token'
import { ResetPasswordValidationError, User, UserPublicView } from '@abx-types/account'
import { findAccountById } from '../account/accounts'
import { createHashedPassword, findUserByEmail, updateUser } from '.'
import { Email, EmailTemplates } from '@abx-types/notification'
import { TokenPayload } from '../token'

export interface Result {
  success: boolean
  message?: string
}

const logger = Logger.getInstance('accounts/lib', 'password')

/**
 * Handler for requesting reset password
 * @param userEmail - Reset password requester's email
 * @return {Result}
 */
export async function resetPasswordRequired(userEmail: string): Promise<Email> {
  logger.debug(`Attempting to reset a password for a user with email: ${userEmail}`)
  const user = await findUserByEmail(userEmail)
  if (!user) {
    logger.error(`Attempted to reset a password for a user that does not exist.   Email Provided: ${userEmail}`)
    throw new ValidationError(ResetPasswordValidationError.userInvalid, {
      context: userEmail,
      status: 400,
    })
  }
  logger.debug(`Found User ${userEmail}, proceeding with generating password reset email`)
  const payload = generateResetPasswordPayload(user.id)
  const options = {
    expiresIn: '1h',
  }
  const token = generateJWToken(payload, options)
  return getResetPasswordEmailMarkup(user, token)
}

/**
 * Get reset password email markup
 * @param user - Reset password requester
 * @param token - JWT token
 */
function getResetPasswordEmailMarkup(user: User, token: string) {
  const url = `${process.env.KMS_DOMAIN}/reset-password?userId=${user.id}&token=${token}`
  logger.debug(`Sending request password reset email to ${user.email} with url: ${url}`)

  const emailRequest: Email = {
    to: user.email,
    subject: 'Kinesis Money Reset Password',
    templateName: EmailTemplates.ResetPassword,
    templateContent: {
      firstname: user.firstName || '',
      username: user.email,
      resetPasswordUrl: url,
    },
  }
  return emailRequest
}

/**
 * Handler for validating the token
 * @param userId - Reset password requester's id
 * @param token - JWT token
 * @return {Result}
 */
export function validateResetPasswordToken(userId: string, token: string): boolean {
  const { success, payload } = verifyJWToken(token)
  if (success && payload) {
    const { user_id } = payload.app_metadata
    return user_id === userId
  }
  return false
}

/**
 * Handler for validating and resetting the new password
 * @param userId - Reset password requester's id
 * @param newPassword - New password
 * @param newPasswordRetyped - New password retyped
 * @return {Result}
 */
export async function createAndSaveNewPassword(userId: string, newPassword: string, newPasswordRetyped: string) {
  const newPasswordEntry = newPassword.trim()
  const newPasswordRetypedEntry = newPasswordRetyped.trim()

  if (newPasswordEntry !== newPasswordRetypedEntry) {
    throw new ValidationError(ResetPasswordValidationError.passwordNotMatch)
  }

  if (newPasswordEntry.length < 12) {
    throw new ValidationError(ResetPasswordValidationError.passwordNotStrength)
  }

  const hashedPassword = await createHashedPassword(newPasswordEntry)
  const users = await updateUser({
    id: userId,
    passwordHash: hashedPassword,
  })
  const user = users[1][0].get('publicView')
  const { hin, status, suspended, type: accountType } = (await findAccountById(user.accountId))!
  return {
    ...user,
    accountType,
    hin,
    status,
    suspended,
  } as UserPublicView
}

/**
 * Generate the payload for reset password token
 * @param userId - Reset password requester's id
 * @return {TokenPayload} - Payload for reset password JWT token
 */
export function generateResetPasswordPayload(userId: string): TokenPayload {
  const payload = {
    app_metadata: {
      user_id: userId,
    },
  }
  return payload
}

export async function createResetPasswordConfirmationEmailContent({ email, firstName, hin }: UserPublicView) {
  logger.debug(`Creating password reset confirmation email for ${email}, name ${firstName} and hin: ${hin}`)

  const emailRequest: Email = {
    to: email,
    subject: 'Kinesis Money Password Reset Confirmation',
    templateName: EmailTemplates.ResetPasswordConfirmation,
    templateContent: {
      name: firstName || '',
      username: email,
      HIN: hin,
    },
  }
  return emailRequest
}
