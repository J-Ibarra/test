import { DepositQueryEndpoints } from '@abx-service-clients/deposit'
import { findDepositRequestById, findDepositAddressesForAccount, findDepositAddressForIds } from '../../../core'
import { InternalRoute, setupInternalApi } from '@abx-utils/internal-api-tools'
import express from 'express'

export function bootstrapInternalApi(app: express.Express) {
  setupInternalApi(app, createQueryEndpointHandlers())
}

function createQueryEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: DepositQueryEndpoints.findDepositRequestById,
      handler: ({ id }) => findDepositRequestById(id),
    },
    {
      path: DepositQueryEndpoints.findDepositRequestsByIds,
      handler: ({ ids }) => findDepositAddressForIds(ids),
    },
    {
      path: DepositQueryEndpoints.findDepositAddressesForAccount,
      handler: ({ accountId }) => findDepositAddressesForAccount(accountId),
    },
  ]
}
