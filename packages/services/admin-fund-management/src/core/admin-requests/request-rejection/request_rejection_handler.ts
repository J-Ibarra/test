import Decimal from 'decimal.js'
import { findAccountWithUserDetails } from '@abx-service-clients/account'
import { SourceEventType } from '@abx-types/balance'
import { Logger } from '@abx-utils/logging'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { getCurrencyId } from '@abx-service-clients/reference-data'
import { AdminRequest, AdminRequestStatus, AdminRequestStatusUpdate, AdminRequestType } from '@abx-service-clients/admin-fund-management'
import { findAdminRequest } from '../requests_repository'
import { updateAdminRequestStatus } from '../update_admin_request'
import { rejectWithdrawalRequest } from './withdrawal_request_rejection_handler'
import { RuntimeError } from '@abx-types/error'
import { denyPendingDeposit, denyPendingRedemption } from '@abx-service-clients/balance'

const logger = Logger.getInstance('request_rejection_handler', 'rejectAdminRequest')

export function rejectAdminRequest({ id, adminId, approvedAt }: AdminRequestStatusUpdate): Promise<AdminRequest> {
  return wrapInTransaction(sequelize, null, async transaction => {
    const request = await findAdminRequest({ id }, transaction)

    if (!request) {
      throw new RuntimeError(`Tried to reject admin request ${id} which could not be found`)
    }
    logger.info(`Rejecting ${request.type} request for account hin ${request.hin} and amount ${request.amount}`)

    const clientAccount = await findAccountWithUserDetails({ hin: request.hin })

    await denyPendingBalanceBasedOnRequestType(clientAccount!.id, request, approvedAt)
    return updateAdminRequestStatus(request.id, adminId, AdminRequestStatus.rejected, transaction)
  })
}

async function denyPendingBalanceBasedOnRequestType(clientAccountId: string, adminRequest: AdminRequest, rejectedAt: Date): Promise<void> {
  const currencyId = await getCurrencyId(adminRequest.asset)

  if (adminRequest.type === AdminRequestType.withdrawal) {
    return rejectWithdrawalRequest(adminRequest, rejectedAt)
  } else if (adminRequest.type === AdminRequestType.deposit) {
    return denyPendingDeposit({
      sourceEventType: SourceEventType.adminRequest,
      sourceEventId: adminRequest.id,
      currencyId,
      accountId: clientAccountId,
      amount: adminRequest.amount,
    })
  }

  return denyPendingRedemption({
    sourceEventType: SourceEventType.adminRequest,
    sourceEventId: adminRequest.id,
    currencyId,
    accountId: clientAccountId,
    amount: new Decimal(adminRequest.amount).add(adminRequest.fee!).toNumber(),
  })
}
