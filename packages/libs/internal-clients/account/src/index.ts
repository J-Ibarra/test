import { User, Account } from '@abx-types/account'
import { getEpicurusInstance } from '@abx/db-connection-utils'
import { AccountEndpoints } from './endpoints'

export function findAccountWithUserDetails(accountQuery: Partial<Account>) {
  const epicurus = getEpicurusInstance()

  return epicurus.request(AccountEndpoints.findAccountWithUserDetails, { accountQuery })
}

export function findAccountById(accountId: string) {
  const epicurus = getEpicurusInstance()

  return epicurus.request(AccountEndpoints.findAccountById, { accountId })
}

export function findAccountsByIdWithUserDetails(accountIds: string[]) {
  const epicurus = getEpicurusInstance()

  return epicurus.request(AccountEndpoints.findAccountsByIdWithUserDetails, { accountIds })
}

export function findUserByAccountId(accountId: string) {
  const epicurus = getEpicurusInstance()

  return epicurus.request(AccountEndpoints.findUserByAccountId, { accountId })
}

export function findUsersByAccountId(accountId: string) {
  const epicurus = getEpicurusInstance()

  return epicurus.request(AccountEndpoints.findUsersByAccountId, { accountId })
}

export function findUser(criteria: Partial<User>, includeAccountDetails: boolean) {
  const epicurus = getEpicurusInstance()

  return epicurus.request(AccountEndpoints.findUser, { criteria, includeAccountDetails })
}

export * from './endpoints'
