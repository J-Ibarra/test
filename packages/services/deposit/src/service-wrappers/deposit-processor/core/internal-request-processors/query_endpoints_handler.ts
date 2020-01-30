import { getEpicurusInstance, messageFactory } from '@abx-utils/db-connection-utils'
import { findDepositRequestByIdSchema, findDepositRequestsByIdsSchema, findDepositAddressesForAccountSchema } from './schema'
import { DepositQueryEndpoints } from '@abx-service-clients/deposit'
import { findDepositRequestById, findDepositAddressesForAccount, findDepositAddressForIds } from '../../../../core'

export function bootstrapQueryEndpoints() {
  const epicurus = getEpicurusInstance()

  epicurus.server(
    DepositQueryEndpoints.findDepositRequestById,
    messageFactory(findDepositRequestByIdSchema, ({ id }) => findDepositRequestById(id)),
  )

  epicurus.server(
    DepositQueryEndpoints.findDepositRequestsByIds,
    messageFactory(findDepositRequestsByIdsSchema, ({ ids }) => findDepositAddressForIds(ids)),
  )

  epicurus.server(
    DepositQueryEndpoints.findDepositAddressesForAccount,
    messageFactory(findDepositAddressesForAccountSchema, ({ accountId }) => findDepositAddressesForAccount(accountId)),
  )
}
