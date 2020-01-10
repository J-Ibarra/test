import * as speakeasy from 'speakeasy'

import { findUserById, updateUser } from '../users'
import { Logger } from '@abx/logging'
import { ValidationError } from '@abx-types/error'

const logger = Logger.getInstance('verify_mfa', 'verifyMfa')

export async function verifyMfa(userId: string, token: string): Promise<void> {
  const user = await findUserById(userId)

  if (!user) {
    throw new Error(`User not found for id ${userId}`)
  }

  const { mfaSecret, mfaTempSecret } = user

  if (mfaSecret) {
    logger.error(`Multifactor authentication has already been enabled for user ${userId}`)
    throw new ValidationError('Multifactor authentication has already been enabled')
  } else if (!mfaTempSecret) {
    logger.error(`Multifactor authentication has not been activated yet for user ${userId}`)
    throw new ValidationError('Multifactor authentication has not been activated yet')
  }

  const isVerified = speakeasy.totp.verify({
    secret: mfaTempSecret,
    token,
    window: 3,
    encoding: 'base32',
  })

  if (!isVerified) {
    logger.error(`MFA Verification invalid for user ${userId}`)
    throw new ValidationError('Verification invalid')
  }

  await updateUser({
    mfaSecret: mfaTempSecret,
    mfaTempSecret: undefined,
    mfaTempSecretCreated: undefined,
    id: userId,
  })
}

export function hasSecretExpired(lifeTimeInMs: number, creationTime: Date) {
  const NOW = Date.now()
  return creationTime.getTime() + lifeTimeInMs < NOW
}
