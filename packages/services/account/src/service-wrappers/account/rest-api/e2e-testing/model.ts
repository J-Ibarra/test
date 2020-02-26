import { AccountType, AccountStatus } from '@abx-types/account'

export interface AccountTypeUpdateRequest {
  email: string
  type: AccountType
}

export interface AccountStatusUpdateRequest {
  email: string
  status: AccountStatus
  // When set to true, mfa verified needs to be set for account
  enableMfa?: boolean
  hasTriggeredKycCheck?: boolean
}
