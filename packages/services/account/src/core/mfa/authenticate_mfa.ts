import * as speakeasy from 'speakeasy'

import { findUserById } from '../users'
import { Logger } from '@abx-utils/logging'
import { ValidationError } from '@abx-types/error'

const logger = Logger.getInstance('authenticate_mfa', 'authenticateMfa')

export async function authenticateMfa(userId: string, token: string): Promise<boolean> {
  const user = await findUserById(userId)

  if (!user) {
    throw new Error(`User not found for id ${userId}`)
  }

  if (!user.mfaSecret) {
    logger.error(`User ${userId} attempted MFA authentication before mfa was activated for the account`)
    throw new ValidationError('Multifactor authentication has not been enabled')
  }

  const isVerified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    token,
    window: 3,
    encoding: 'base32',
  })

  return isVerified
}
