import { findUserById } from '../users'

export async function hasMfaEnabled(userId: string): Promise<boolean> {
  const user = await findUserById(userId)

  if (!user) {
    throw new Error(`User not found for id ${userId}`)
  }

  return user.mfaSecret ? true : false
}
