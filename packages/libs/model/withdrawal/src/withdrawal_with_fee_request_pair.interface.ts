import { CurrencyEnrichedWithdrawalRequest } from './withdrawal_request.interface'

export interface WithdrawalWithFeeRequestPair {
  withdrawalRequest: CurrencyEnrichedWithdrawalRequest
  feeRequest?: CurrencyEnrichedWithdrawalRequest | null
}
