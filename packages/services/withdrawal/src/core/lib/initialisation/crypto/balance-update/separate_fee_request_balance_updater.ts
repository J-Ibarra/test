import { findOrCreateKinesisRevenueAccount } from '@abx-service-clients/account'
import { SourceEventType } from '@abx-types/balance'
import { WithdrawalRequest } from '@abx-types/withdrawal'
import { createPendingDeposit, createPendingWithdrawal } from '@abx-service-clients/balance'

export async function separateFeeRequestBalanceUpdate(withdrawalRequest: WithdrawalRequest, amountWithoutFee: number, withdrawalFee: number) {
  const kinesisRevenueAccount = await findOrCreateKinesisRevenueAccount()

  return Promise.all([
    createPendingDeposit({
      accountId: kinesisRevenueAccount.id,
      amount: withdrawalFee,
      currencyId: withdrawalRequest.feeCurrencyId!,
      sourceEventId: withdrawalRequest.id!,
      sourceEventType: SourceEventType.currencyWithdrawalFee,
    }),
    createPendingWithdrawal({
      pendingWithdrawalParams: {
        accountId: withdrawalRequest.accountId,
        amount: amountWithoutFee,
        currencyId: withdrawalRequest.currencyId,
        sourceEventId: withdrawalRequest.id!,
        sourceEventType: SourceEventType.currencyWithdrawal,
      },
      pendingWithdrawalFeeParams: {
        accountId: withdrawalRequest.accountId,
        amount: withdrawalFee,
        currencyId: withdrawalRequest.feeCurrencyId!,
        sourceEventId: withdrawalRequest.id!,
        sourceEventType: SourceEventType.currencyWithdrawalFee,
      },
    }),
  ])
}
