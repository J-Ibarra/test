import { getEpicurusInstance, messageFactory } from '@abx-utils/db-connection-utils'
import { findAccountByIdSchema, findUserByAccountIdSchema, findAccountsByIdWithUserDetailsSchema } from './schema'
import { findAccountById, findUserByAccountId, findUsersByAccountId, findAccountsByIdWithUserDetails } from '../core'
import { AccountEndpoints } from '@abx-service-clients/account'

export function bootstrapQueryEndpoints() {
  const epicurus = getEpicurusInstance()

  epicurus.server(
    AccountEndpoints.findAccountById,
    messageFactory(findAccountByIdSchema, ({ accountId }) => findAccountById(accountId)),
  )

  epicurus.server(
    AccountEndpoints.findUserByAccountId,
    messageFactory(findUserByAccountIdSchema, ({ accountId }) => findUserByAccountId(accountId)),
  )

  epicurus.server(
    AccountEndpoints.findAccountsByIdWithUserDetails,
    messageFactory(findAccountsByIdWithUserDetailsSchema, ({ accountIds }) => findAccountsByIdWithUserDetails(accountIds)),
  )

  epicurus.server(
    AccountEndpoints.findUsersByAccountId,
    messageFactory(findUsersByAccountId, ({ accountIds }) => findAccountsByIdWithUserDetails(accountIds)),
  )
}
