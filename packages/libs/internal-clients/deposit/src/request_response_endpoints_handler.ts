import { DepositQueryEndpoints } from './request_response_endpoints'
import { DepositAddress, DepositRequest } from '@abx-types/deposit'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'

export const DEPOSIT_API_PORT = 3112

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(DEPOSIT_API_PORT)

export function findDepositAddressesForAccount(accountId: string): Promise<DepositAddress[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<DepositAddress[]>(DepositQueryEndpoints.findDepositAddressesForAccount, { accountId })
}

export function findDepositRequestById(id: number): Promise<DepositRequest | null> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<DepositRequest | null>(DepositQueryEndpoints.findDepositAddressesForAccount, { id })
}

export function findDepositRequestsByIds(ids: number[]): Promise<DepositRequest[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<DepositRequest[]>(DepositQueryEndpoints.findDepositRequestsByIds, { ids })
}
