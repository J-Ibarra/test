import { getEpicurusInstance, messageFactory } from '@abx-utils/db-connection-utils'
import {
  findAdminRequestSchema,
  saveClientTriggeredFiatWithdrawalAdminRequestSchema,
  findAdminRequestsSchema,
  updateAdminRequestSchema,
} from './schema'
import { findAdminRequest, updateAdminRequest, saveClientTriggeredFiatWithdrawalAdminRequest, findSpecificAdminRequests } from '../core'
import { AdminFundManagementEndpoints } from '@abx-service-clients/admin-fund-management'

export function bootstrapQueryEndpoints() {
  const epicurus = getEpicurusInstance()

  epicurus.server(
    AdminFundManagementEndpoints.findAdminRequest,
    messageFactory(findAdminRequestSchema, request => findAdminRequest(request)),
  )

  epicurus.server(
    AdminFundManagementEndpoints.findAdminRequests,
    messageFactory(findAdminRequestsSchema, ({ ids }) => findSpecificAdminRequests(ids)),
  )

  epicurus.server(
    AdminFundManagementEndpoints.saveClientTriggeredFiatWithdrawalAdminRequest,
    messageFactory(saveClientTriggeredFiatWithdrawalAdminRequestSchema, ({ accountId, currencyCode, amount, memo }) =>
      saveClientTriggeredFiatWithdrawalAdminRequest(accountId, currencyCode, amount, memo),
    ),
  )

  epicurus.server(
    AdminFundManagementEndpoints.updateAdminRequest,
    messageFactory(updateAdminRequestSchema, ({ id, update }) => updateAdminRequest(id, update)),
  )
}
