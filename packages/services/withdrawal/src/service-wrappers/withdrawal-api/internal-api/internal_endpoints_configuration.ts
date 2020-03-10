import { WithdrawalApiEndpoints, findWithdrawalRequestsForTransactionHashes, findWithdrawalRequestsByIds } from '@abx-service-clients/withdrawal'
import { findWithdrawalRequestById, getWithdrawalFee, getWithdrawalFees, findWithdrawalRequestByTxHash } from '../../../core'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createRequestResponseEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: WithdrawalApiEndpoints.findWithdrawalRequestForTransactionHash,
      handler: ({ txHash }) => findWithdrawalRequestByTxHash(txHash),
    },
    {
      path: WithdrawalApiEndpoints.findWithdrawalRequestsForTransactionHashes,
      handler: ({ txHashes }) => findWithdrawalRequestsForTransactionHashes(txHashes),
    },
    {
      path: WithdrawalApiEndpoints.findWithdrawalRequestById,
      handler: ({ id }) => findWithdrawalRequestById(id),
    },
    {
      path: WithdrawalApiEndpoints.findWithdrawalRequestsByIds,
      handler: ({ ids }) => findWithdrawalRequestsByIds(ids),
    },
    {
      path: WithdrawalApiEndpoints.getWithdrawalFee,
      handler: ({ currencyCode, withdrawalAmount, adminRequestId }) => getWithdrawalFee(currencyCode, withdrawalAmount, adminRequestId),
    },
    {
      path: WithdrawalApiEndpoints.getWithdrawalFees,
      handler: ({ currencyCode, withdrawalParams }) => getWithdrawalFees(currencyCode, withdrawalParams),
    },
  ]
}
