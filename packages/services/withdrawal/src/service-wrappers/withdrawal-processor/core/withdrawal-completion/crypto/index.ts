import { WithdrawalRequest } from '@abx-types/withdrawal'
import { completeNoFeeRequestCryptoWithdrawal } from './complete_no_fee_request_withdrawal'
import { completeCryptoWithdrawalWithSeparateFeeRequest } from './complete_withdrawal_with_fee_request'
import { sendCryptoWithdrawalSuccessEmail } from './withdrawal_completion_email_sender'
import { findCurrencyForId } from '@abx-service-clients/reference-data'
import { Transaction } from 'sequelize'
import { SymbolPairStateFilter } from '@abx-types/reference-data'

export async function completeCryptoWithdrawal(
  withdrawalRequest: WithdrawalRequest,
  transaction: Transaction,
  feeRequest?: WithdrawalRequest | null,
) {
  const withdrawalCurrency = await findCurrencyForId(withdrawalRequest.currencyId, SymbolPairStateFilter.all)

  if (!!feeRequest) {
    await completeCryptoWithdrawalWithSeparateFeeRequest({ ...withdrawalRequest, currency: withdrawalCurrency }, feeRequest, transaction)
  } else {
    await completeNoFeeRequestCryptoWithdrawal({ ...withdrawalRequest, currency: withdrawalCurrency }, transaction)
  }

  return sendCryptoWithdrawalSuccessEmail({ ...withdrawalRequest, currency: withdrawalCurrency })
}
