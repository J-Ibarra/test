import { Transaction } from 'sequelize'
import { findAccountWithUserDetails } from '@abx-service-clients/account'
import { SourceEventType } from '@abx-types/balance'
import { sequelize, wrapInTransaction } from '@abx/db-connection-utils'
import { getCurrencyId } from '@abx-service-clients/reference-data'
import { createCurrencyTransaction } from '@abx-service-clients/order'
import { AdminRequest, AdminRequestStatus } from '@abx-service-clients/admin-fund-management'
import { Logger } from '@abx/logging'
import { getEpicurusInstance as getInstance } from '@abx/db-connection-utils'
import { updateAdminRequestStatus } from '../update_admin_request'
import { confirmPendingDeposit } from '@abx-service-clients/balance'
import { DepositPubSubChannels } from '@abx-service-clients/deposit'
import { TransactionDirection } from '@abx-types/order'

const logger = Logger.getInstance('deposit_approval_handler', 'approveDeposit')

export function approveDeposit(adminRequest: AdminRequest, adminId: string, transaction: Transaction, approvedAt: Date): Promise<AdminRequest> {
  return wrapInTransaction(sequelize, transaction, async t => {
    logger.info(
      `Approving admin deposit request(${adminRequest.id} for account ${adminRequest.hin} and amount ${adminRequest.amount} + fee ${adminRequest.fee} )`,
    )
    const [clientAccount, currencyId] = await Promise.all([findAccountWithUserDetails({ hin: adminRequest.hin }), getCurrencyId(adminRequest.asset)])

    await Promise.all([
      confirmPendingDeposit({
        sourceEventType: SourceEventType.adminRequest,
        sourceEventId: adminRequest.id,
        currencyId: currencyId!,
        accountId: clientAccount!.id,
        amount: adminRequest.amount,
      }),
      createCurrencyTransaction({
        accountId: clientAccount!.id,
        amount: adminRequest.amount,
        currencyId: currencyId!,
        direction: TransactionDirection.deposit,
        requestId: adminRequest.id,
      }),
    ])

    const epicurus = getInstance()
    epicurus.publish(DepositPubSubChannels.depositRequestCreated, {
      accountId: clientAccount!.id,
      amount: adminRequest.amount,
      currencyCode: adminRequest.asset,
      dateOfApproval: approvedAt,
      notes: adminRequest.description,
      transactionId: adminRequest.globalTransactionId,
    })

    return updateAdminRequestStatus(adminRequest.id, adminId, AdminRequestStatus.approved, t)
  })
}
