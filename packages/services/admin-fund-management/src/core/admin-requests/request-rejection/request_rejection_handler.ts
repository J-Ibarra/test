import Decimal from 'decimal.js'
import { Transaction } from 'sequelize'
import { findAccountWithUserDetails } from '@abx-service-clients/account'
import { BalanceMovementFacade } from '@abx-service-clients/balance'
import { SourceEventType } from '@abx-types/balance'
import { Logger } from '@abx/logging'
import { sequelize, wrapInTransaction } from '@abx/db-connection-utils'
import { getCurrencyId } from '@abx-service-clients/reference-data'
import { AdminRequest, AdminRequestStatus, AdminRequestStatusUpdate, AdminRequestType } from '@abx-service-clients/admin-fund-management'
import { findAdminRequest } from '../requests_repository'
import { updateAdminRequestStatus } from '../update_admin_request'
import { rejectWithdrawalRequest } from './withdrawal_request_rejection_handler'

const balanceMovementFacade = BalanceMovementFacade.getInstance()

const logger = Logger.getInstance('request_rejection_handler', 'rejectAdminRequest')

export function rejectAdminRequest({ id, adminId, approvedAt }: AdminRequestStatusUpdate): Promise<AdminRequest> {
  return wrapInTransaction(sequelize, null, async transaction => {
    const request = await findAdminRequest({ id }, transaction)
    logger.info(`Rejecting ${request.type} request for account hin ${request.hin} and amount ${request.amount}`)

    const clientAccount = await findAccountWithUserDetails({ hin: request.hin }, transaction)

    await denyPendingBalanceBasedOnRequestType(clientAccount.id, request, transaction, approvedAt)
    return updateAdminRequestStatus(request.id, adminId, AdminRequestStatus.rejected, transaction)
  })
}

async function denyPendingBalanceBasedOnRequestType(
  clientAccountId: string,
  adminRequest: AdminRequest,
  transaction: Transaction,
  rejectedAt: Date,
): Promise<void> {
  const currencyId = await getCurrencyId(adminRequest.asset)

  if (adminRequest.type === AdminRequestType.withdrawal) {
    return rejectWithdrawalRequest(currencyId, adminRequest, transaction, rejectedAt)
  } else if (adminRequest.type === AdminRequestType.deposit) {
    return balanceMovementFacade.denyPendingDeposit({
      sourceEventType: SourceEventType.adminRequest,
      sourceEventId: adminRequest.id,
      currencyId,
      accountId: clientAccountId,
      amount: adminRequest.amount,
      t: transaction,
    })
  }

  return balanceMovementFacade.denyPendingRedemption({
    sourceEventType: SourceEventType.adminRequest,
    sourceEventId: adminRequest.id,
    currencyId,
    accountId: clientAccountId,
    amount: new Decimal(adminRequest.amount).add(adminRequest.fee).toNumber(),
    t: transaction,
  })
}
