import { WithdrawalRequest } from './withdrawal_request.interface'

export interface WithdrawalWithFeeRequestPair {
  withdrawalRequest: WithdrawalRequest
  feeRequest?: WithdrawalRequest
}
