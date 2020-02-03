import { WithdrawalEndpoints, findWithdrawalRequestsForTransactionHashes, findWithdrawalRequestsByIds } from '@abx-service-clients/withdrawal'
import { findWithdrawalRequest, findWithdrawalRequestById, getWithdrawalFee, completeFiatWithdrawal, getWithdrawalFees } from '../core'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createRequestResponseEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: WithdrawalEndpoints.findWithdrawalRequestForTransactionHash,
      handler: ({ txHash }) => findWithdrawalRequest({ txHash }),
    },
    {
      path: WithdrawalEndpoints.findWithdrawalRequestsForTransactionHashes,
      handler: ({ txHashes }) => findWithdrawalRequestsForTransactionHashes(txHashes),
    },
    {
      path: WithdrawalEndpoints.findWithdrawalRequestById,
      handler: ({ id }) => findWithdrawalRequestById(id),
    },
    {
      path: WithdrawalEndpoints.findWithdrawalRequestsByIds,
      handler: ({ ids }) => findWithdrawalRequestsByIds(ids),
    },
    {
      path: WithdrawalEndpoints.findWithdrawalRequestsByIds,
      handler: ({ ids }) => findWithdrawalRequestsByIds(ids),
    },
    {
      path: WithdrawalEndpoints.getWithdrawalFee,
      handler: ({ currencyCode, withdrawalAmount, adminRequestId }) => getWithdrawalFee(currencyCode, withdrawalAmount, adminRequestId),
    },
    {
      path: WithdrawalEndpoints.getWithdrawalFees,
      handler: ({ currencyCode, withdrawalParams }) => getWithdrawalFees(currencyCode, withdrawalParams),
    },
    {
      path: WithdrawalEndpoints.completeFiatWithdrawal,
      handler: ({ adminRequestId, fee }) => completeFiatWithdrawal({ adminRequestId, fee }),
    },
  ]
}