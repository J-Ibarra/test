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

export * from './endpoints'
