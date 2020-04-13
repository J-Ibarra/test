import * as speakeasy from 'speakeasy'

import { findUserById, updateUser } from '../users'
import { ValidationError } from '@abx-types/error'

export async function deactivateMfa(userId: string, token: string): Promise<void> {
  const user = await findUserById(userId)

  if (!user) {
    throw new Error(`User not found for id ${userId}`)
  }

  const { mfaSecret, mfaTempSecret } = user
  if (!mfaSecret && !mfaTempSecret) {
    throw new ValidationError('Multifactor authentication has already been disabled')
  }

  const isVerified = speakeasy.totp.verify({
    secret: mfaSecret,
    token,
    window: 3,
    encoding: 'base32',
  })

  if (!isVerified) {
    throw new ValidationError('Verification invalid')
  }

  await updateUser({
    mfaSecret: null,
    mfaTempSecret: null,
    id: userId,
  } as any)
}

export async function deactivateMfaAdmin(request: { userId: string; suspended: boolean }): Promise<void> {

  const user = await findUserById(request.userId)

  if (!user) {
    throw new Error(`User not found for id ${request.userId}`)
  }

  const { mfaSecret, mfaTempSecret } = user
  if (!mfaSecret && !mfaTempSecret) {
    throw new ValidationError('Multifactor authentication has already been disabled')
  }
  if (request.suspended) {
    await updateUser({
      mfaSecret: null,
      mfaTempSecret: null,
      id: request.userId,
    } as any)
  }

}
