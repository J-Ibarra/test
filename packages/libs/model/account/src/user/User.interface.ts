import { Account } from '../account'

export interface User {
  id: string
  account?: Account
  accountId: string
  firstName?: string
  lastName?: string
  email: string
  passwordHash: string
  activated?: boolean
  passwordResetKey?: string
  mfaTempSecret?: string
  mfaSecret?: string
  lastLogin?: Date
  mfaTempSecretCreated?: Date
  mfaEnabled?: boolean
  qrcodeUrl?: string
  referredBy?: string
}
