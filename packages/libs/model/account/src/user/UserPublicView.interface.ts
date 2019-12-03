import { User } from './User.interface'
import { AccountType } from '../account/AccountType.enum'
import { AccountStatus } from '../account/AccountStatus.enum'

export interface UserPublicView extends Pick<User, 'id' | 'accountId' | 'email' | 'firstName' | 'lastName' | 'lastLogin'> {
  /** True if MFA has been enabled by the user. */
  mfaEnabled: boolean
  /** The type of the owner account. */
  accountType: AccountType
  /** The status of the owner account. */
  status: AccountStatus
  /** The hin of the owner account */
  hin: string
  /** The hasTriggeredKycCheck value of the owner account */
  hasTriggeredKycCheck?: boolean
}
