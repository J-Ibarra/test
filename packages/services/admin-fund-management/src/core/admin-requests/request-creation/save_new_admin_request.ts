import { Transaction } from 'sequelize'
import { Account } from '@abx-types/account'
import { findAccountWithUserDetails } from '@abx-service-clients/account'

import { getWithdrawalConfigForCurrency } from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'

import { AdminRequest, AdminRequestStatus, AdminRequestType, NewAdminRequestParams } from '@abx-service-clients/admin-fund-management'
import { saveAdminRequest } from '../requests_repository'

export async function saveNewAdminRequest(
  request: NewAdminRequestParams,
  clientAccount: Account,
  transaction: Transaction,
) {
  const adminAccount = await findAccountWithUserDetails({ id: request.adminAccountId })

  return saveAdminRequest(
    {
      client: `${clientAccount.users[0].firstName} ${clientAccount.users[0].lastName}`,
      hin: request.hin,
      type: request.type,
      description: request.description,
      asset: request.asset,
      amount: request.amount,
      fee: request.fee,
      admin: `${adminAccount.users[0].firstName} ${adminAccount.users[0].lastName}`,
      status: AdminRequestStatus.pending,
    },
    transaction,
  )
}

export async function saveClientTriggeredFiatWithdrawalAdminRequest(
  accountId: string,
  currencyCode: CurrencyCode,
  amount: number,
  memo: string,
  transaction: Transaction,
): Promise<AdminRequest> {
  const clientAccount = await findAccountWithUserDetails({ id: accountId })
  const { feeAmount } = await getWithdrawalConfigForCurrency({ currencyCode })

  return saveAdminRequest(
    {
      client: `${clientAccount.users[0].firstName} ${clientAccount.users[0].lastName}`,
      hin: clientAccount.hin,
      type: AdminRequestType.withdrawal,
      description: memo,
      asset: currencyCode,
      amount,
      fee: feeAmount,
      admin: `N/A`,
      status: AdminRequestStatus.pending,
    },
    transaction,
  )
}
