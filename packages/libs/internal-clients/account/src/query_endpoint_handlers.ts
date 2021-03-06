import { AccountQueryEndpoints } from './endpoints'
import { User, Account, KycVerifiedAccountDetails } from '@abx-types/account'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'

export const ACCOUNT_REST_API_PORT = 3103

let operatorAccount: Account | null
let kinesisRevenueAccount: Account | null

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(ACCOUNT_REST_API_PORT)

export function findAccountById(accountId: string): Promise<Account> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<Account>(AccountQueryEndpoints.findAccountById, { accountId })
}

export function findAccountWithUserDetails(criteria: Partial<Account>): Promise<Account | null> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<Account | null>(AccountQueryEndpoints.findAccountWithUserDetails, { ...criteria })
}

export function findAccountsByIdWithUserDetails(accountIds: string[]): Promise<Account[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<Account[]>(AccountQueryEndpoints.findAccountsByIdWithUserDetails, { accountIds })
}

export function findUserByAccountId(accountId: string): Promise<User | null> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<User | null>(AccountQueryEndpoints.findUserByAccountId, { accountId })
}

export function findUsersByEmail(emails: string[]): Promise<User[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<User[]>(AccountQueryEndpoints.findUsersByEmail, { emails })
}

export async function isAccountSuspended(accountId: string): Promise<boolean> {
  const { accountSuspended } = await internalApiRequestDispatcher.fireRequestToInternalApi<{ accountSuspended: boolean }>(
    AccountQueryEndpoints.isAccountSuspended,
    { accountId },
  )

  return accountSuspended
}

export function findUsersByAccountId(accountId: string): Promise<User[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<User[]>(AccountQueryEndpoints.findUsersByAccountId, { accountId })
}

export async function findOrCreateKinesisRevenueAccount(): Promise<Account> {
  if (!!kinesisRevenueAccount) {
    return kinesisRevenueAccount
  }

  return internalApiRequestDispatcher.fireRequestToInternalApi<Account>(AccountQueryEndpoints.findOrCreateKinesisRevenueAccount)
}

export async function findOrCreateOperatorAccount(): Promise<Account> {
  if (!!operatorAccount) {
    return operatorAccount
  }

  return internalApiRequestDispatcher.fireRequestToInternalApi<Account>(AccountQueryEndpoints.findOrCreateOperatorAccount)
}

/**
 * Retrieves the Kyc verification details recorded for the account in Salesforce.
 *
 * @param accountId the account id to retrieve the details for
 */
export async function getKycVerifiedAccountDetails(accountId: string): Promise<KycVerifiedAccountDetails> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<KycVerifiedAccountDetails>(AccountQueryEndpoints.getKycVerifiedAccountDetails, {
    accountId,
  })
}

/**
 * Retrieves the IDs of all KYC verified accounts.
 * Since this is an expensive operations, a {@code cacheExpiryInSeconds} can be used if we want to cache the
 * result in memory for x number of seconds.
 *
 * @param cacheExpiryInSeconds the cache expiry in seconds
 */
export async function getAllKycOrEmailVerifiedAccountIds(cacheExpiryInSeconds?: number): Promise<Set<string>> {
  let kycOrEmailVerifiedAccountIds: string[] = await internalApiRequestDispatcher.returnCachedValueOrRetrieveFromSource<string[]>({
    endpoint: AccountQueryEndpoints.getAllKycOrEmailVerifiedAccountIds,
    ttl: cacheExpiryInSeconds || 0,
  })

  return new Set<string>(kycOrEmailVerifiedAccountIds)
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
    kycVerifiedAccountIds = await internalApiRequestDispatcher.returnCachedValueOrRetrieveFromSource<string[]>({
      endpoint: AccountQueryEndpoints.getAllKycVerifiedAccountIds,
      ttl: cacheExpiryInSeconds,
    })
  }

  kycVerifiedAccountIds = await internalApiRequestDispatcher.fireRequestToInternalApi<string[]>(AccountQueryEndpoints.getAllKycVerifiedAccountIds)
  return new Set<string>(kycVerifiedAccountIds)
}

export * from './endpoints'
export * from './pub_sub_channels'
