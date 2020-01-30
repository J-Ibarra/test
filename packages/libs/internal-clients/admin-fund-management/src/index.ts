import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { AdminRequest } from './model'

import { AdminFundManagementEndpoints } from './endpoints'

export async function findAdminRequest(queryParams: Partial<AdminRequest>): Promise<AdminRequest> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(AdminFundManagementEndpoints.findAdminRequest, { ...queryParams })
}

export async function findAdminRequests(ids: number[]): Promise<AdminRequest[]> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(AdminFundManagementEndpoints.findAdminRequest, { ids })
}

export async function saveClientTriggeredFiatWithdrawalAdminRequest(
  accountId: string,
  currencyCode: CurrencyCode,
  amount: number,
  memo: string | null,
): Promise<AdminRequest> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(AdminFundManagementEndpoints.saveClientTriggeredFiatWithdrawalAdminRequest, {
    accountId,
    currencyCode,
    amount,
    memo,
  })
}

export async function updateAdminRequest(id: number, update: Partial<AdminRequest>): Promise<AdminRequest> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(AdminFundManagementEndpoints.updateAdminRequest, { id, update })
}

export * from './endpoints'
export * from './model'
