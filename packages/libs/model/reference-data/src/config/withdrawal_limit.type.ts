import { AccountStatus } from '@abx-types/account'

export type WithdrawalLimit = { [k in Exclude<AccountStatus, 'registered'>]: number }
