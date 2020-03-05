import { WithdrawalRequest } from '@abx-types/withdrawal'
import { completeNoFeeRequestCryptoWithdrawal } from './complete_no_fee_request_withdrawal'
import { completeCryptoWithdrawalWithSeparateFeeRequest } from './complete_withdrawal_with_fee_request'
import { sendCryptoWithdrawalSuccessEmail } from './withdrawal_completion_email_sender'
import { findCurrencyForId } from '@abx-service-clients/reference-data'

export async function completeCryptoWithdrawal(withdrawalRequest: WithdrawalRequest, feeRequest?: WithdrawalRequest | null) {
  const withdrawalCurrency = await findCurrencyForId(withdrawalRequest.currencyId)

  if (!!feeRequest) {
    await completeCryptoWithdrawalWithSeparateFeeRequest({ ...withdrawalRequest, currency: withdrawalCurrency }, feeRequest)
  } else {
    await completeNoFeeRequestCryptoWithdrawal({ ...withdrawalRequest, currency: withdrawalCurrency })
  }

  return sendCryptoWithdrawalSuccessEmail({ ...withdrawalRequest, currency: withdrawalCurrency })
}
