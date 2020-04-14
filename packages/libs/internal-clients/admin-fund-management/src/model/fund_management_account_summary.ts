import { AccountStatus } from '@abx-types/account'
import { BalanceSummary } from './balance_summary'

export interface FundManagementAccountSummary {
  id: string
  hin: string
  email: string
  status: AccountStatus
  suspended: boolean
  firstName: string
  lastName: string
  lastLogin: Date
  createdAt: Date
  mfaEnabled: boolean
  mfaTempSecretCreated?: Date
  balances: BalanceSummary[]
  
}

