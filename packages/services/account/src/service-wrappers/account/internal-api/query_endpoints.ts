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
import { AccountQueryEndpoints, findUsersByEmail } from '@abx-service-clients/account'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createQueryEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: AccountQueryEndpoints.findAccountById,
      handler: ({ accountId }) => findAccountById(accountId),
    },
    {
      path: AccountQueryEndpoints.findUserByAccountId,
      handler: ({ accountId }) => findUserByAccountId(accountId),
    },
    {
      path: AccountQueryEndpoints.findUsersByEmail,
      handler: ({ emails }) => findUsersByEmail(emails),
    },
    {
      path: AccountQueryEndpoints.findAccountsByIdWithUserDetails,
      handler: ({ accountIds }) => findAccountsByIdWithUserDetails(accountIds),
    },
    {
      path: AccountQueryEndpoints.findUsersByAccountId,
      handler: ({ accountId }) => findUsersByAccountId(accountId),
    },
    {
      path: AccountQueryEndpoints.findAccountWithUserDetails,
      handler: request => findAccountWithUserDetails(request),
    },
    {
      path: AccountQueryEndpoints.findOrCreateKinesisRevenueAccount,
      handler: () => findOrCreateKinesisRevenueAccount(),
    },
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
      handler: async ({ account }) => {
        const accountSuspended = await isAccountSuspended(account)

        return { accountSuspended }
      },
    },
  ]
}
