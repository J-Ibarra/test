import { getEpicurusInstance } from '@abx/db-connection-utils'
import { AccountEndpoints } from './endpoints'
import { User, Account } from '@abx-types/account'

export function findAccountById(accountId: string) {
  const epicurus = getEpicurusInstance()

  return epicurus.request(AccountEndpoints.findAccountById, { accountId })
}

export function findAccountWithUserDetails(criteria: Partial<Account>): Promise<Account | null> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(AccountEndpoints.findUserByAccountId, { ...criteria })
}

export function findAccountsByIdWithUserDetails(accountIds: string[]) {
  const epicurus = getEpicurusInstance()

  return epicurus.request(AccountEndpoints.findAccountsByIdWithUserDetails, { accountIds })
}

export function findUserByAccountId(accountId: string): Promise<User | null> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(AccountEndpoints.findUserByAccountId, { accountId })
}

export function findUsersByAccountId(accountId: string): Promise<User[]> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(AccountEndpoints.findUsersByAccountId, { accountId })
}

export function findUser(criteria: Partial<User>, includeAccountDetails: boolean) {
  const epicurus = getEpicurusInstance()

  return epicurus.request(AccountEndpoints.findUser, { criteria, includeAccountDetails })
}

export function findOrCreateKinesisRevenueAccount(): Promise<Account> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(AccountEndpoints.findOrCreateKinesisRevenueAccount, {})
}

export * from './endpoints'
export * from './notification_topics'
