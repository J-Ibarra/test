import {
  findAccountById,
  findUserByAccountId,
  findAccountsByIdWithUserDetails,
  findAccountWithUserDetails,
  findOrCreateKinesisRevenueAccount,
  findOrCreateOperatorAccount,
  isAccountSuspended,
  findUsersByAccountId,
} from '../../../core'
import { AccountEndpoints } from '@abx-service-clients/account'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createQueryEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: AccountEndpoints.findAccountById,
      handler: ({ accountId }) => findAccountById(accountId),
    },
    {
      path: AccountEndpoints.findUserByAccountId,
      handler: ({ accountId }) => findUserByAccountId(accountId),
    },
    {
      path: AccountEndpoints.findAccountsByIdWithUserDetails,
      handler: ({ accountIds }) => findAccountsByIdWithUserDetails(accountIds),
    },
    {
      path: AccountEndpoints.findUsersByAccountId,
      handler: ({ accountId }) => findUsersByAccountId(accountId),
    },
    {
      path: AccountEndpoints.findAccountWithUserDetails,
      handler: request => findAccountWithUserDetails(request),
    },
    {
      path: AccountEndpoints.findOrCreateKinesisRevenueAccount,
      handler: () => findOrCreateKinesisRevenueAccount(),
    },
    {
      path: AccountEndpoints.findOrCreateOperatorAccount,
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
      path: AccountEndpoints.isAccountSuspended,
      handler: async ({ account }) => {
        const accountSuspended = await isAccountSuspended(account)

        return { accountSuspended }
      },
    },
  ]
}
