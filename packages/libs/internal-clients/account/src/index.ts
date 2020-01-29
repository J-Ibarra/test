import { getEpicurusInstance, MemoryCache } from '@abx-utils/db-connection-utils'
import { AccountEndpoints } from './endpoints'
import { User, Account } from '@abx-types/account'

const memoryCache = MemoryCache.getInstance()

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

export function isAccountSuspended(accountId: string): Promise<boolean> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(AccountEndpoints.isAccountSuspended, { accountId })
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

export function findOrCreateOperatorAccount() {
  const epicurus = getEpicurusInstance()

  return epicurus.request(AccountEndpoints.findOrCreateOperatorAccount, {})
}

export function getNamesAndEmailsOfUsers() {
  const epicurus = getEpicurusInstance()

  return epicurus.request(AccountEndpoints.getNamesAndEmailsOfUsers, {})
}

/**
 * Retrieves the IDs of all KYC verified accounts.
 * Since this is an expensive operations, a {@code cacheExpiryInSeconds} can be used if we want to cache the
 * result in memory for x number of seconds.
 *
 * @param cacheExpiryInSeconds the cache expiry in seconds
 */
export async function getAllKycVerifiedAccountIds(cacheExpiryInSeconds?: number): Promise<Set<string>> {
  let kycVerifiedAccountIds: string[] = []
  if (!!cacheExpiryInSeconds) {
    kycVerifiedAccountIds = await returnCachedValueOrRetrieveFromSource<string[]>(
      AccountEndpoints.getAllKycVerifiedAccountIds,
      'getAllKycVerifiedAccountIds',
      cacheExpiryInSeconds,
    )
  }

  const epicurus = getEpicurusInstance()

  kycVerifiedAccountIds = await epicurus.request(AccountEndpoints.getAllKycVerifiedAccountIds, {})

  return new Set<string>(kycVerifiedAccountIds)
}

async function returnCachedValueOrRetrieveFromSource<T>(endpoint: AccountEndpoints, cacheKey: string, cacheExpiryInSeconds: number): Promise<T> {
  const cachedValue = await memoryCache.get(cacheKey)

  if (!!cachedValue) {
    return cachedValue as T
  }

  const epicurus = getEpicurusInstance()

  const freshValue = await epicurus.request(endpoint, {})
  await memoryCache.set<string[]>({
    key: cacheKey,
    ttl: cacheExpiryInSeconds,
    val: freshValue,
  })

  return freshValue
}

export * from './endpoints'
export * from './pub_sub_channels'
