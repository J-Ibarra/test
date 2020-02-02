import { findAdminRequest, updateAdminRequest, saveClientTriggeredFiatWithdrawalAdminRequest, findSpecificAdminRequests } from '../core'
import { AdminFundManagementEndpoints } from '@abx-service-clients/admin-fund-management'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createQueryEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: AdminFundManagementEndpoints.findAdminRequest,
      handler: request => findAdminRequest(request),
    },
    {
      path: AdminFundManagementEndpoints.findAdminRequests,
      handler: ({ ids }) => findSpecificAdminRequests(ids),
    },
    {
      path: AdminFundManagementEndpoints.saveClientTriggeredFiatWithdrawalAdminRequest,
      handler: ({ accountId, currencyCode, amount, memo }) => saveClientTriggeredFiatWithdrawalAdminRequest(accountId, currencyCode, amount, memo),
    },
    {
      path: AdminFundManagementEndpoints.updateAdminRequest,
      handler: ({ id, update }) => updateAdminRequest(id, update),
    },
  ]
}
