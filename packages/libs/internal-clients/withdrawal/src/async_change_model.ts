import { CurrencyCode } from '@abx-types/reference-data'
import { IConfirmedTransactionEventPayload } from '@abx-utils/blockchain-currency-gateway'
export enum WithdrawalStatusChangeRequestType {
  cancelFiatWithdrawal = 'cancelFiatWithdrawal',
  createFiatWithdrawal = 'createFiatWithdrawal',
  completeFiatWithdrawal = 'completeFiatWithdrawal',
}

export interface FiatWithdrawalCancellationChangeRequest {
  adminRequestId: number
}

export interface FiatWithdrawalCompletionRequestPayload {
  adminRequestId: number
  fee: number
}

export interface FiatWithdrawalCreationRequest {
  amount: number
  accountId: string
  memo: string
  currencyCode: CurrencyCode
  transactionId: string
  transactionFee: number
  adminRequestId: number
  createdAt: Date
}

export interface AsyncWithdrawalStatusChangeRequest {
  type: WithdrawalStatusChangeRequestType
  payload: FiatWithdrawalCancellationChangeRequest | FiatWithdrawalCreationRequest | FiatWithdrawalCompletionRequestPayload
}

export enum EWebhookWithdrawalCompletedRequestType {
  confirmedTransaction = 'confirmedTransaction',
}
export interface IAsyncWebhookWithdrawalCompletedRequest {
  type: EWebhookWithdrawalCompletedRequestType
  payload: IConfirmedTransactionEventPayload
}
