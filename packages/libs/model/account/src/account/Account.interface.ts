import { AccountType } from './AccountType.enum'
import { User } from '../user/User.interface'
import { AccountStatus } from './AccountStatus.enum'

/**
 * Defines a top-level platform account.
 * @tsoaModel
 */
export interface Account {
  /** The generated account id. */
  id: string
  hin?: string
  /** The account type. */
  type?: AccountType
  /** The users associated with the account. */
  users?: User[]
  /** The current status. */
  status: AccountStatus
  /** True when the account has been suspended. */
  suspended: boolean
  createdAt?: Date
  hasTriggeredKycCheck?: boolean
}
