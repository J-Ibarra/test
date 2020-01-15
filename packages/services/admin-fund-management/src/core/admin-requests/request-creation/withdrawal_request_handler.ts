import { Account } from '@abx-types/account'
import { CurrencyBoundary } from '@abx-types/reference-data'
import { WITHDRAWAL_MEMO_MAX_LENGTH } from '@abx-types/withdrawal'
import { AdminRequest } from '@abx-service-clients/admin-fund-management'
import { createFiatWithdrawal } from '@abx-service-clients/withdrawal'

export async function handleWithdrawalRequestCreation(adminRequest: AdminRequest, clientAccount: Account, _: CurrencyBoundary) {
  await createFiatWithdrawal({
    amount: adminRequest.amount,
    accountId: clientAccount.id,
    memo:
      adminRequest.description && adminRequest.description.length > WITHDRAWAL_MEMO_MAX_LENGTH
        ? `${adminRequest.description.substring(0, WITHDRAWAL_MEMO_MAX_LENGTH - 3)}...`
        : adminRequest.description!,
    currencyCode: adminRequest.asset,
    transactionId: adminRequest.globalTransactionId,
    transactionFee: adminRequest.fee!,
    adminRequestId: adminRequest.id,
    createdAt: adminRequest.createdAt,
  })
}
