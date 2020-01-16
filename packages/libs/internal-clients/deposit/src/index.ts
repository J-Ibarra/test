import { getEpicurusInstance } from '@abx/db-connection-utils'
import { DepositEndpoints } from './endpoints'
import { DepositAddress, DepositRequest } from '@abx-types/deposit'

export function findDepositAddressesForAccount(accountId: string): Promise<DepositAddress[]> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(DepositEndpoints.findDepositAddressesForAccount, { accountId })
}

export function findDepositRequestById(id: number): Promise<DepositRequest | null> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(DepositEndpoints.findDepositRequestById, { id })
}

export function findDepositRequestsByIds(ids: number[]): Promise<DepositRequest[]> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(DepositEndpoints.findDepositRequestsByIds, { ids })
}

export * from './endpoints'
export * from './pub_sub_channels'
