import {
  findAccountById,
  findUserByAccountId,
  findAccountsByIdWithUserDetails,
  findAccountWithUserDetails,
  findOrCreateKinesisRevenueAccount,
  findOrCreateOperatorAccount,
  isAccountSuspended,
  findUsersByAccountId,
  findUsersByEmail,
  findAllKycVerifiedAccountIds,
  findAllKycOrEmailVerifiedAccountIds,
} from '../../../core'
import { AccountQueryEndpoints } from '@abx-service-clients/account'
import { InternalRoute } from '@abx-utils/internal-api-tools'
import { User, Account, KycVerifiedAccountDetails } from '@abx-types/account'

export function createQueryEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: AccountQueryEndpoints.findAccountById,
      handler: ({ accountId }) => findAccountById(accountId),
    } as InternalRoute<{ accountId: string }, Account | null>,
    {
      path: AccountQueryEndpoints.findUserByAccountId,
      handler: ({ accountId }) => findUserByAccountId(accountId),
    } as InternalRoute<{ accountId: string }, User | null>,
    {
      path: AccountQueryEndpoints.findUsersByEmail,
      handler: ({ emails }) => findUsersByEmail(emails),
    } as InternalRoute<{ emails: string[] }, User[]>,
    {
      path: AccountQueryEndpoints.findAccountsByIdWithUserDetails,
      handler: ({ accountIds }) => findAccountsByIdWithUserDetails(accountIds),
    } as InternalRoute<{ accountIds: string[] }, Account[]>,
    {
      path: AccountQueryEndpoints.findUsersByAccountId,
      handler: ({ accountId }) => findUsersByAccountId(accountId),
    } as InternalRoute<{ accountId: string }, User[]>,
    {
      path: AccountQueryEndpoints.findAccountWithUserDetails,
      handler: request => findAccountWithUserDetails(request),
    } as InternalRoute<Partial<Account>, Account | null>,
    {
      path: AccountQueryEndpoints.findOrCreateKinesisRevenueAccount,
      handler: () => findOrCreateKinesisRevenueAccount(),
    } as InternalRoute<void, Account>,
    {
      path: AccountQueryEndpoints.findOrCreateOperatorAccount,
      handler: async () => {
        try {
          const acc = await findOrCreateOperatorAccount()
          return acc
        } catch (e) {
          throw e
        }
      },
    },
    {
      path: AccountQueryEndpoints.isAccountSuspended,
      handler: async ({ accountId }) => {
        const accountSuspended = await isAccountSuspended(accountId)

        return { accountSuspended }
      },
    },
    {
      path: AccountQueryEndpoints.getAllKycVerifiedAccountIds,
      handler: () => findAllKycVerifiedAccountIds(),
    } as InternalRoute<{}, string[]>,
    {
      path: AccountQueryEndpoints.getAllKycOrEmailVerifiedAccountIds,
      handler: () => findAllKycOrEmailVerifiedAccountIds(),
    } as InternalRoute<{}, string[]>,
  ]
}
