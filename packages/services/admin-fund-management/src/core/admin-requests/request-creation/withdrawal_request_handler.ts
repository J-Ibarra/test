import { Transaction } from 'sequelize'
import { Account } from '@abx-types/account'
import { CurrencyBoundary } from '@abx-types/reference-data'
import { findCurrencyForCode } from '@abx-types/reference-data'

import { WITHDRAWAL_MEMO_MAX_LENGTH } from '@abx-types/withdrawal'

import { handleFiatCurrencyWithdrawalRequest } from '@abx-service-clients/withdrawal'

import { AdminRequest } from '@abx-service-clients/admin-fund-management'

export async function handleWithdrawalRequestCreation(
  adminRequest: AdminRequest,
  clientAccount: Account,
  _: CurrencyBoundary,
  transaction: Transaction,
) {
  const currency = await findCurrencyForCode(adminRequest.asset)

  await handleFiatCurrencyWithdrawalRequest({
    params: {
      amount: adminRequest.amount,
      accountId: clientAccount.id,
      memo:
        adminRequest.description && adminRequest.description.length > WITHDRAWAL_MEMO_MAX_LENGTH
          ? `${adminRequest.description.substring(0, WITHDRAWAL_MEMO_MAX_LENGTH - 3)}...`
          : adminRequest.description,
      currencyCode: adminRequest.asset,
      transactionId: adminRequest.globalTransactionId,
      transactionFee: adminRequest.fee,
      adminRequestId: adminRequest.id,
    },
    currency,
    createdAt: adminRequest.createdAt,
    transaction,
    saveAdminRequest: false,
  })
}
