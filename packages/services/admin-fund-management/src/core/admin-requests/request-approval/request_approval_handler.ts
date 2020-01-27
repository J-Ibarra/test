import { Logger } from '@abx-utils/logging'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { AdminRequest, AdminRequestStatusUpdate, AdminRequestType } from '@abx-service-clients/admin-fund-management'
import { findAdminRequest } from '../requests_repository'
import { approveDeposit } from './deposit_approval_handler'
import { approveRedemption } from './redemption_approval_handler'
import { approveWithdrawal } from './withdrawal_approval_handler'
import { RuntimeError } from '@abx-types/error'

const logger = Logger.getInstance('request_approval_handler', 'createAdminRequest')

export function approveAdminRequest({ id, adminId, approvedAt }: AdminRequestStatusUpdate): Promise<AdminRequest> {
  return wrapInTransaction(sequelize, null, async transaction => {
    const request = await findAdminRequest({ id }, transaction)

    if (!request) {
      throw new RuntimeError(`Tried to approve admin request which could not be found ${request!.id}`)
    }

    logger.info(`Approving ${request.type} request for account hin ${request.hin} and amount ${request.amount}`)

    if (request.type === AdminRequestType.withdrawal) {
      return approveWithdrawal(request, adminId, transaction, approvedAt)
    } else if (request.type === AdminRequestType.deposit) {
      return approveDeposit(request, adminId, transaction, approvedAt)
    }

    return approveRedemption(request, adminId, transaction)
  })
}
