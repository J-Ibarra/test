import { Transaction } from 'sequelize'
import { Account } from '@abx-types/account'
import { findAccountWithUserDetails } from '@abx-service-clients/account'
import { CurrencyBoundary } from '@abx-types/reference-data'
import { findBoundaryForCurrency } from '@abx-service-clients/reference-data'
import { Logger } from '@abx/logging'
import { sequelize, wrapInTransaction } from '@abx/db-connection-utils'
import { AdminRequest, AdminRequestType, NewAdminRequestParams } from '@abx-service-clients/admin-fund-management'

import { handleDepositRequestCreation } from './deposit_request_handler'
import { handleRedemptionRequestCreation } from './redemption_request_handler'
import { saveNewAdminRequest } from './save_new_admin_request'
import { handleWithdrawalRequestCreation } from './withdrawal_request_handler'

const logger = Logger.getInstance('request-creation-handler', 'createAdminRequest')

export function createAdminRequest(request: NewAdminRequestParams): Promise<AdminRequest> {
  return wrapInTransaction(sequelize, null, async transaction => {
    logger.info(
      `Creating ${request.type} admin request for account hin ${request.hin} and amount ${
        request.amount
      }`,
    )
    const clientAccount = await findAccountWithUserDetails({ hin: request.hin }, transaction)
    const adminRequest = await saveNewAdminRequest(request, clientAccount, transaction)
    const boundaryForCurrency = await findBoundaryForCurrency(request.asset)

    const createPendingBalance = getPendingBalanceHandlerBasedOnRequestType(adminRequest.type)

    await createPendingBalance(adminRequest, clientAccount, boundaryForCurrency, transaction)
    logger.info(
      `Created ${request.type} admin request for account hin ${request.hin} and amount ${
        request.amount
      } with global transaction id of ${adminRequest.globalTransactionId}`,
    )
    return adminRequest
  })
}

function getPendingBalanceHandlerBasedOnRequestType(
  adminRequestType: AdminRequestType,
): (
  adminRequest: AdminRequest,
  clientAccount: Account,
  currencyBoundary: CurrencyBoundary,
  transaction: Transaction,
) => Promise<void> {
  if (adminRequestType === AdminRequestType.withdrawal) {
    return handleWithdrawalRequestCreation
  } else if (adminRequestType === AdminRequestType.deposit) {
    return handleDepositRequestCreation
  }

  return handleRedemptionRequestCreation
}
