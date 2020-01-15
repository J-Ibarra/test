import { Transaction } from 'sequelize'
import { Logger } from '@abx/logging'
import { sequelize, wrapInTransaction } from '@abx/db-connection-utils'
import { getEpicurusInstance as getInstance } from '@abx/db-connection-utils'
import { getCurrencyId } from '@abx-service-clients/reference-data'
import { WithdrawalState } from '@abx-types/withdrawal'
import { AdminRequest, AdminRequestStatus, WithdrawalUpdateRequest } from '@abx-service-clients/admin-fund-management'
import { completeFiatWithdrawal, findWithdrawalRequest } from '@abx-service-clients/withdrawal'
import { updateAdminRequestStatus } from '../update_admin_request'


//Please check I'm not sure about this reference
import { EpicurusPubSubChannel } from '@abx/db-connection-utils' 


const logger = Logger.getInstance('withdrawal_approval_handler', 'approveWithdrawal')

export function approveWithdrawal(adminRequest: AdminRequest, adminId: string, transaction: Transaction, approvedAt: Date): Promise<AdminRequest> {
  return wrapInTransaction(sequelize, transaction, async t => {
    logger.info(
      `Approving admin withdrawal request(${adminRequest.id} for account ${adminRequest.hin} and amount ${adminRequest.amount} + fee ${
        adminRequest.fee
      } )`,
    )
    const currencyId = await getCurrencyId(adminRequest.asset)
    const requestBeingConfirmed = await findWithdrawalRequest({
      currencyId,
      amount: adminRequest.amount,
      state: WithdrawalState.pending,
      adminRequestId: adminRequest.id,
    })
    await completeFiatWithdrawal({ id: requestBeingConfirmed.id, fee: adminRequest.fee })

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
  epicurus.publish(EpicurusPubSubChannel.withdrawalRequestUpdated, withdrawalUpdateRequestParams)
}
