import { WithdrawalRequest } from '@abx-types/withdrawal'
import { noFeeRequestBalanceUpdate } from './no_fee_request_balance_updater'
import { separateFeeRequestBalanceUpdate } from './separate_fee_request_balance_updater'

export async function updatePendingWithdrawerAndKinesisRevenueAccounts(
  withdrawalRequest: WithdrawalRequest,
  amountWithoutFee: number,
  withdrawalFee: number,
) {
  if (withdrawalRequest.currencyId !== withdrawalRequest.feeCurrencyId) {
    return separateFeeRequestBalanceUpdate(withdrawalRequest, amountWithoutFee, withdrawalFee)
  }

  return noFeeRequestBalanceUpdate(withdrawalRequest, withdrawalFee)
}
