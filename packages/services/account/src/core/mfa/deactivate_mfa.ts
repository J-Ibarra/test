import * as speakeasy from 'speakeasy'

import { findUserById, findUserByAccountId, findUserByAccountHin, updateUser } from '../users'
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

export async function deactivateMfaAdmin(request: { hin: string }): Promise<void> {

  const account = await findUserByAccountHin(request.hin)

  if (!account) {
    throw new Error(`User Account not found for Hin ${request.hin}`)
  }

  const { mfaSecret, mfaTempSecret } = account

  if (!mfaSecret && !mfaTempSecret) {
    throw new ValidationError('Multifactor authentication has already been disabled' )
  }

  const user = await findUserByAccountId(account!.accountId)

  if (!user) {
    throw new Error(`User not found for accountId ` + account!.accountId)
  } else {
    await updateUser({
      mfaSecret: null,
      mfaTempSecret: null,
      id: user!.id,
    } as any)
  }
}
