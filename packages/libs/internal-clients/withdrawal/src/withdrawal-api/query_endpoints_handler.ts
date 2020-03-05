import { WithdrawalApiEndpoints } from './endpoints'
import { WithdrawalRequest } from '@abx-types/withdrawal'
import { CurrencyCode } from '@abx-types/reference-data'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'

export const WITHDRAWAL_API_SERVICE_PORT = 3108

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(WITHDRAWAL_API_SERVICE_PORT)

export function findWithdrawalRequestForTransactionHash(txHash: string): Promise<WithdrawalRequest | null> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<WithdrawalRequest | null>(
    WithdrawalApiEndpoints.findWithdrawalRequestForTransactionHash,
    { txHash },
  )
}

export function findWithdrawalRequestsForTransactionHashes(txHashes: string[]): Promise<WithdrawalRequest[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<WithdrawalRequest[]>(
    WithdrawalApiEndpoints.findWithdrawalRequestsForTransactionHashes,
    {
      txHashes,
    },
  )
}

export function findWithdrawalRequestById(id: number): Promise<WithdrawalRequest | null> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<WithdrawalRequest | null>(WithdrawalApiEndpoints.findWithdrawalRequestById, { id })
}

export function findWithdrawalRequestsByIds(ids: number[]): Promise<WithdrawalRequest[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<WithdrawalRequest[]>(WithdrawalApiEndpoints.findWithdrawalRequestsByIds, { ids })
}

export function getWithdrawalFee(
  currencyCode: CurrencyCode,
  withdrawalAmount: number,
  adminRequestId?: number,
): Promise<{ withdrawalFee: number; feeCurrencyCode: CurrencyCode }> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<{ withdrawalFee: number; feeCurrencyCode: CurrencyCode }>(
    WithdrawalApiEndpoints.getWithdrawalFee,
    {
      currencyCode,
      withdrawalAmount,
      adminRequestId,
    },
  )
}

export function getWithdrawalFees(
  currencyCode: CurrencyCode,
  withdrawalParams: {
    withdrawalRequestId: number
    withdrawalAmount: number
    adminRequestId?: number
  }[],
): Promise<{ withdrawalRequestId: number; withdrawalFee: number; feeCurrencyCode: CurrencyCode }[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<
    { withdrawalRequestId: number; withdrawalFee: number; feeCurrencyCode: CurrencyCode }[]
  >(WithdrawalApiEndpoints.getWithdrawalFees, { currencyCode, withdrawalParams })
}
