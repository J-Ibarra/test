import { WithdrawalRequest } from '@abx-types/withdrawal'
import { completeNoFeeRequestCryptoWithdrawal } from './complete_no_fee_request_withdrawal'
import { completeCryptoWithdrawalWithSeparateFeeRequest } from './complete_withdrawal_with_fee_request'

export function completeCryptoWithdrawal(withdrawalRequest: WithdrawalRequest, feeRequest?: WithdrawalRequest | null) {
  if (!!feeRequest) {
    return completeCryptoWithdrawalWithSeparateFeeRequest(withdrawalRequest, feeRequest)
  }

  return completeNoFeeRequestCryptoWithdrawal(withdrawalRequest)
}
