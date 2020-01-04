import { InitialiseWithdrawalParams } from './initialise_withdrawal_params.interface'
import { WithdrawalState } from './withdrawal_state.enum'

export interface EnrichedInitialisationParams extends InitialiseWithdrawalParams {
  memo: string
  state: WithdrawalState
  createdAt?: Date
}
