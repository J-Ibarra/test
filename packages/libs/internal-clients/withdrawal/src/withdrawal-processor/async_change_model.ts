import { CurrencyCode } from '@abx-types/reference-data'
import { IConfirmedTransactionEventPayload } from '@abx-utils/blockchain-currency-gateway'

export interface CryptoWithdrawalRequestWrapper {
  isBatch: boolean
}

/** Used whenever a new withdrawal has been created by the user, upon withdrawal validation, after the withdrawal request is created. */
export interface SingleCryptoWithdrawalRequestWrapper extends CryptoWithdrawalRequestWrapper {
  isBatch: false
  id: number
}

/** Used in order to trigger batch withdrawal processing for waiting requests. (A scenario valid only for BTC at the moment) */
export interface BatchCryptoWithdrawalRequestWrapper extends CryptoWithdrawalRequestWrapper {
  isBatch: true
  currency: CurrencyCode.bitcoin
}

export enum WithdrawalStatusChangeRequestType {
  cancelFiatWithdrawal = 'cancelFiatWithdrawal',
  createFiatWithdrawal = 'createFiatWithdrawal',
  createCryptoWithdrawal = 'createCryptoWithdrawal',
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
  payload:
    | FiatWithdrawalCancellationChangeRequest
    | FiatWithdrawalCreationRequest
    | FiatWithdrawalCompletionRequestPayload
    | CryptoWithdrawalRequestWrapper
}

export enum EWebhookWithdrawalCompletedRequestType {
  confirmedTransaction = 'confirmedTransaction',
}
export interface IAsyncWebhookWithdrawalCompletedRequest {
  type: EWebhookWithdrawalCompletedRequestType
  payload: IConfirmedTransactionEventPayload
}
