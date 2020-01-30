import { getEpicurusInstance, messageFactory } from '@abx-utils/db-connection-utils'
import {
  findAccountByIdSchema,
  findUserByAccountIdSchema,
  findUsersByAccountIdSchema,
  findOrCreateKinesisRevenueAccountSchema,
  findAccountWithUserDetailsSchema,
  findAccountsByIdWithUserDetailsSchema,
  isAccountSuspendedSchema,
  findOrCreateOperatorAccountSchema,
  getAllKycVerifiedAccountIdsSchema,
} from './schema'
import {
  findAccountById,
  findUserByAccountId,
  findAccountsByIdWithUserDetails,
  findAccountWithUserDetails,
  findOrCreateKinesisRevenueAccount,
  findOrCreateOperatorAccount,
  findAllKycVerifiedAccountIds,
  isAccountSuspended,
} from '../../../core'
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
    messageFactory(findUsersByAccountIdSchema, ({ accountIds }) => findAccountsByIdWithUserDetails(accountIds)),
  )

  epicurus.server(
    AccountEndpoints.findAccountWithUserDetails,
    messageFactory(findAccountWithUserDetailsSchema, request => findAccountWithUserDetails(request)),
  )

  epicurus.server(
    AccountEndpoints.findOrCreateKinesisRevenueAccount,
    messageFactory(findOrCreateKinesisRevenueAccountSchema, () => findOrCreateKinesisRevenueAccount()),
  )

  epicurus.server(
    AccountEndpoints.findOrCreateOperatorAccount,
    messageFactory(findOrCreateOperatorAccountSchema, () => findOrCreateOperatorAccount()),
  )

  epicurus.server(
    AccountEndpoints.isAccountSuspended,
    messageFactory(isAccountSuspendedSchema, ({ accountId }) => isAccountSuspended(accountId)),
  )

  epicurus.server(
    AccountEndpoints.getAllKycVerifiedAccountIds,
    messageFactory(getAllKycVerifiedAccountIdsSchema, () => findAllKycVerifiedAccountIds()),
  )
}
