import { Transaction } from 'sequelize'
import { Logger } from '@abx-utils/logging'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { getEpicurusInstance as getInstance } from '@abx-utils/db-connection-utils'
import { AdminRequest, AdminRequestStatus, WithdrawalUpdateRequest } from '@abx-service-clients/admin-fund-management'
import { completeFiatWithdrawal, WithdrawalPubSubChannels } from '@abx-service-clients/withdrawal'
import { updateAdminRequestStatus } from '../update_admin_request'

const logger = Logger.getInstance('withdrawal_approval_handler', 'approveWithdrawal')

export function approveWithdrawal(adminRequest: AdminRequest, adminId: string, transaction: Transaction, approvedAt: Date): Promise<AdminRequest> {
  return wrapInTransaction(sequelize, transaction, async t => {
    logger.info(
      `Approving admin withdrawal request(${adminRequest.id} for account ${adminRequest.hin} and amount ${adminRequest.amount} + fee ${adminRequest.fee} )`,
    )
    await completeFiatWithdrawal(adminRequest.id, adminRequest.fee!)

    const updatedAdminWithdrawalRequest = await updateAdminRequestStatus(adminRequest.id, adminId, AdminRequestStatus.approved, t)
    sendWithdarawRequestStatusUpdateNotification(adminRequest, adminRequest.globalTransactionId, approvedAt)

    return updatedAdminWithdrawalRequest
  })
}

const sendWithdarawRequestStatusUpdateNotification = (adminRequest: AdminRequest, globalTransactionId: string, approvedAt: Date) => {
  const withdrawalUpdateRequestParams: WithdrawalUpdateRequest = {
    globalTransactionId,
    description: adminRequest.description,
    paymentStatus: 'Processed',
    updatedAt: approvedAt,
    tradingPlatformName: adminRequest.tradingPlatformName,
  }

  const epicurus = getInstance()
  epicurus.publish(WithdrawalPubSubChannels.withdrawalRequestUpdated, withdrawalUpdateRequestParams)
}
