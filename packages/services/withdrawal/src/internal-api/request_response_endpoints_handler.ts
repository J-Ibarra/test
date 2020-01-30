import { getEpicurusInstance, messageFactory } from '@abx-utils/db-connection-utils'
import { WithdrawalEndpoints, findWithdrawalRequestsForTransactionHashes, findWithdrawalRequestsByIds } from '@abx-service-clients/withdrawal'
import { findWithdrawalRequest, findWithdrawalRequestById, getWithdrawalFee, completeFiatWithdrawal, getWithdrawalFees } from '../core'
import {
  getWithdrawalFeesSchema,
  completeFiatWithdrawalSchema,
  getWithdrawalFeeSchema,
  findWithdrawalRequestByIdSchema,
  findWithdrawalRequestForTransactionHashSchema,
  findWithdrawalRequestsForTransactionHashesSchema,
  findWithdrawalRequestsByIdsSchema,
} from './schema'

export function bootstrapRequestResponseApi() {
  const epicurus = getEpicurusInstance()

  epicurus.server(
    WithdrawalEndpoints.findWithdrawalRequestForTransactionHash,
    messageFactory(findWithdrawalRequestForTransactionHashSchema, ({ txHash }) => findWithdrawalRequest({ txHash })),
  )

  epicurus.server(
    WithdrawalEndpoints.findWithdrawalRequestsForTransactionHashes,
    messageFactory(findWithdrawalRequestsForTransactionHashesSchema, ({ txHashes }) => findWithdrawalRequestsForTransactionHashes(txHashes)),
  )

  epicurus.server(
    WithdrawalEndpoints.findWithdrawalRequestById,
    messageFactory(findWithdrawalRequestByIdSchema, ({ id }) => findWithdrawalRequestById(id)),
  )

  epicurus.server(
    WithdrawalEndpoints.findWithdrawalRequestsByIds,
    messageFactory(findWithdrawalRequestsByIdsSchema, ({ ids }) => findWithdrawalRequestsByIds(ids)),
  )

  epicurus.server(
    WithdrawalEndpoints.getWithdrawalFee,
    messageFactory(getWithdrawalFeeSchema, ({ currencyCode, withdrawalAmount, adminRequestId }) =>
      getWithdrawalFee(currencyCode, withdrawalAmount, adminRequestId),
    ),
  )

  epicurus.server(
    WithdrawalEndpoints.getWithdrawalFees,
    messageFactory(getWithdrawalFeesSchema, ({ currencyCode, withdrawalParams }) => getWithdrawalFees(currencyCode, withdrawalParams)),
  )

  epicurus.server(
    WithdrawalEndpoints.completeFiatWithdrawal,
    messageFactory(completeFiatWithdrawalSchema, ({ adminRequestId, fee }) => completeFiatWithdrawal({ adminRequestId, fee })),
  )
}
