import { DepositQueryEndpoints } from '@abx-service-clients/deposit'
import {
  findDepositRequestById,
  findDepositAddressesForAccount,
  findDepositRequestsForIds,
  getDepositRequestsForAccountAndCurrency,
} from '../../../core'
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
      handler: ({ ids }) => findDepositRequestsForIds(ids),
    },
    {
      path: DepositQueryEndpoints.findDepositRequestsForAccountAndCurrency,
      handler: ({ accountId, currencyId }) => getDepositRequestsForAccountAndCurrency(accountId, currencyId),
    },
    {
      path: DepositQueryEndpoints.findDepositAddressesForAccount,
      handler: ({ accountId }) => findDepositAddressesForAccount(accountId),
    },
  ]
}
