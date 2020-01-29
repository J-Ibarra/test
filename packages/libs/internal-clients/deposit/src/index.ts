import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { DepositAddress, DepositRequest } from '@abx-types/deposit'
import { DepositQueryEndpoints } from './request_response_endpoints'

export function findDepositAddressesForAccount(accountId: string): Promise<DepositAddress[]> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(DepositQueryEndpoints.findDepositAddressesForAccount, { accountId })
}

export function findDepositRequestById(id: number): Promise<DepositRequest | null> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(DepositQueryEndpoints.findDepositRequestById, { id })
}

export function findDepositRequestsByIds(ids: number[]): Promise<DepositRequest[]> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(DepositQueryEndpoints.findDepositRequestsByIds, { ids })
}

export * from './request_response_endpoints'
export * from './pub_sub_channels'
export * from './async_endpoints_handler'
export * from './async_endpoint_request'
