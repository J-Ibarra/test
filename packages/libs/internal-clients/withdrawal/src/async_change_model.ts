export enum WithdrawalStatusChangeRequestType {
  cancelFiatWithdrawal = 'cancelFiatWithdrawal',
}

interface FiatCancellationChangeRequest {
  adminRequestId: number
}

export interface AsyncWithdrawalStatusChangeRequest {
  type: WithdrawalStatusChangeRequestType
  payload: FiatCancellationChangeRequest
}
