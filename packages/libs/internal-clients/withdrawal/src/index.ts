import { getEpicurusInstance } from '@abx/db-connection-utils'
import { WithdrawalEndpoints } from './endpoints'
import { WithdrawalRequest } from '@abx-types/withdrawal'

export function findWithdrawalRequestForTransactionHash(txHash: string): Promise<WithdrawalRequest | null> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(WithdrawalEndpoints.findWithdrawalRequestForTransactionHash, { txHash })
}

export function findWithdrawalRequestById(id: number): Promise<WithdrawalRequest | null> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(WithdrawalEndpoints.findWithdrawalRequestById, { id })
}

export function findWithdrawalRequestsByIds(ids: number[]): Promise<WithdrawalRequest | null> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(WithdrawalEndpoints.findWithdrawalRequestsByIds, { ids })
}

export * from './endpoints'
