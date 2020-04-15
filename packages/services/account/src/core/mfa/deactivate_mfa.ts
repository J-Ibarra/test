import * as speakeasy from 'speakeasy'

import { findUserById, findUserByAccountHin, updateUser } from '../users'
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

export async function deactivateUserMfa(request: { hin: string }): Promise<void> {
  const user = await findUserByAccountHin(request.hin)

  if (!user) {
    throw new Error(`User Account not found for Hin ${request.hin}`)
  } else if (!user.mfaSecret && !user.mfaTempSecret) {
    throw new ValidationError('Multifactor authentication has already been disabled')
  }

  await updateUser({
    mfaSecret: null,
    mfaTempSecret: null,
    qrcodeUrl: null,
    id: user!.id,
  } as any)
}
