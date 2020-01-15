import { Transaction } from 'sequelize'
import { findAccountWithUserDetails } from '@abx-service-clients/account'
import { BalanceMovementFacade } from '@abx-service-clients/balance'
import { SourceEventType } from '@abx-types/balance'
import { sequelize, wrapInTransaction } from '@abx/db-connection-utils'
import { getCurrencyId } from '@abx-service-clients/reference-data'
import { createCurrencyTransaction, TransactionDirection } from '@abx-service-clients/order'
import { AdminRequest, AdminRequestStatus } from '@abx-service-clients/admin-fund-management'
import { Logger } from '@abx/logging'
import { getEpicurusInstance as getInstance } from '@abx/db-connection-utils'
import { updateAdminRequestStatus } from '../update_admin_request'


//Please check I'm not sure about this reference
import { EpicurusPubSubChannel } from '@abx/db-connection-utils' 


const balanceMovementFacade = BalanceMovementFacade.getInstance()
const logger = Logger.getInstance('deposit_approval_handler', 'approveDeposit')

export function approveDeposit(adminRequest: AdminRequest, adminId: string, transaction: Transaction, approvedAt: Date): Promise<AdminRequest> {
  return wrapInTransaction(sequelize, transaction, async t => {
    logger.info(
      `Approving admin deposit request(${adminRequest.id} for account ${adminRequest.hin} and amount ${adminRequest.amount} + fee ${
        adminRequest.fee
      } )`,
    )
    const clientAccount = await findAccountWithUserDetails({ hin: adminRequest.hin }, t)

    const currencyId = await getCurrencyId(adminRequest.asset)
    await balanceMovementFacade.confirmPendingDeposit({
      sourceEventType: SourceEventType.adminRequest,
      sourceEventId: adminRequest.id,
      currencyId,
      accountId: clientAccount.id,
      amount: adminRequest.amount,
      t,
    })
    await createCurrencyTransaction({
      accountId: clientAccount.id,
      amount: adminRequest.amount,
      currencyId,
      direction: TransactionDirection.deposit,
      requestId: adminRequest.id,
    })

    const epicurus = getInstance()
    epicurus.publish(EpicurusPubSubChannel.depositRequestCreated, {
      accountId: clientAccount.id,
      amount: adminRequest.amount,
      currencyCode: adminRequest.asset,
      dateOfApproval: approvedAt,
      notes: adminRequest.description,
      transactionId: adminRequest.globalTransactionId,
    })

    return updateAdminRequestStatus(adminRequest.id, adminId, AdminRequestStatus.approved, t)
  })
}
