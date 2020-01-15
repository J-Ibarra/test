import { Logger } from '@abx/logging'
import { sequelize, wrapInTransaction } from '@abx/db-connection-utils'
import { AdminRequest, AdminRequestStatusUpdate, AdminRequestType } from '@abx-service-clients/admin-fund-management'
import { findAdminRequest } from '../requests_repository'
import { approveDeposit } from './deposit_approval_handler'
import { approveRedemption } from './redemption_approval_handler'
import { approveWithdrawal } from './withdrawal_approval_handler'

const logger = Logger.getInstance('request_approval_handler', 'createAdminRequest')

export function approveAdminRequest({
  id,
  adminId,
  approvedAt,
}: AdminRequestStatusUpdate): Promise<AdminRequest> {
  return wrapInTransaction(sequelize, null, async transaction => {
    const request = await findAdminRequest({ id }, transaction)
    logger.info(
      `Approving ${request.type} request for account hin ${request.hin} and amount ${
      request.amount
      }`,
    )

    if (request.type === AdminRequestType.withdrawal) {
      return approveWithdrawal(request, adminId, transaction, approvedAt)
    } else if (request.type === AdminRequestType.deposit) {
      return approveDeposit(request, adminId, transaction, approvedAt)
    }

    return approveRedemption(request, adminId, transaction)
  })
}
