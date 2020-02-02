import { CurrencyCode } from '@abx-types/reference-data'
import { AdminRequest } from './model'

import { AdminFundManagementEndpoints } from './endpoints'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'

export const ADMIN_FUND_MANAGEMENT_REST_API_PORT = 3109

const requestDispatcher = new InternalApiRequestDispatcher(ADMIN_FUND_MANAGEMENT_REST_API_PORT)

export async function findAdminRequest(queryParams: Partial<AdminRequest>): Promise<AdminRequest> {
  return requestDispatcher.fireRequestToInternalApi<AdminRequest>(AdminFundManagementEndpoints.findAdminRequest, { ...queryParams })
}

export async function findAdminRequests(ids: number[]): Promise<AdminRequest[]> {
  return requestDispatcher.fireRequestToInternalApi<AdminRequest[]>(AdminFundManagementEndpoints.findAdminRequests, { ids })
}

export async function saveClientTriggeredFiatWithdrawalAdminRequest(
  accountId: string,
  currencyCode: CurrencyCode,
  amount: number,
  memo: string | null,
): Promise<AdminRequest> {
  return requestDispatcher.fireRequestToInternalApi<AdminRequest>(AdminFundManagementEndpoints.saveClientTriggeredFiatWithdrawalAdminRequest, {
    accountId,
    currencyCode,
    amount,
    memo,
  })
}

export async function updateAdminRequest(id: number, update: Partial<AdminRequest>): Promise<AdminRequest> {
  return requestDispatcher.fireRequestToInternalApi<AdminRequest>(AdminFundManagementEndpoints.updateAdminRequest, { id, update })
}

export * from './endpoints'
export * from './model'
