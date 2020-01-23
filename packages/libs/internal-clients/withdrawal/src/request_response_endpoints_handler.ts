import { getEpicurusInstance } from '@abx/db-connection-utils'
import { WithdrawalEndpoints } from './endpoints'
import { WithdrawalRequest } from '@abx-types/withdrawal'
import { CurrencyCode } from '@abx-types/reference-data'

export function findWithdrawalRequestForTransactionHash(txHash: string): Promise<WithdrawalRequest | null> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(WithdrawalEndpoints.findWithdrawalRequestForTransactionHash, { txHash })
}

export function findWithdrawalRequestsForTransactionHashes(txHashes: string[]): Promise<WithdrawalRequest[]> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(WithdrawalEndpoints.findWithdrawalRequestForTransactionHash, { txHashes })
}

export function findWithdrawalRequestById(id: number): Promise<WithdrawalRequest | null> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(WithdrawalEndpoints.findWithdrawalRequestById, { id })
}

export function findWithdrawalRequestsByIds(ids: number[]): Promise<WithdrawalRequest[]> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(WithdrawalEndpoints.findWithdrawalRequestsByIds, { ids })
}

export function getWithdrawalFee(
  currencyCode: CurrencyCode,
  withdrawalAmount: number,
  adminRequestId?: number,
): Promise<{ withdrawalFee: number; feeCurrencyCode: CurrencyCode }> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(WithdrawalEndpoints.getWithdrawalFee, { currencyCode, withdrawalAmount, adminRequestId })
}

export function getWithdrawalFees(
  currencyCode: CurrencyCode,
  withdrawalParams: {
    withdrawalRequestId: number
    withdrawalAmount: number
    adminRequestId?: number
  }[],
): Promise<{ withdrawalRequestId: number; withdrawalFee: number; feeCurrencyCode: CurrencyCode }[]> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(WithdrawalEndpoints.getWithdrawalFees, { currencyCode, withdrawalParams })
}

export function completeFiatWithdrawal(adminRequestId: number, fee: number) {
  const epicurus = getEpicurusInstance()

  return epicurus.request(WithdrawalEndpoints.completeFiatWithdrawal, { adminRequestId, fee })
}
