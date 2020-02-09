import { PayloadWrapper, ENetworkTypes, EWebhookEvents } from '..'
import { CurrencyCode } from '@abx-types/reference-data'

export interface ITransactionConfirmationsRequest {
  callbackURL: string
  address: string
  confirmations: number
}

export interface ITransactionConfirmationsResponse extends PayloadWrapper<ITransactionConfirmations> {}

export interface ITransactionConfirmations {
  uuid: string
  event: EWebhookEvents.TRANSACTION_CONFIRMATIONS
  confirmations: number
  address: string
  url: string
  created: Date
  active: boolean
}

export interface ITransactionConfirmationsEventPayload {
  currentConfirmations: number
  address: string
  blockHeight: number
  currency: CurrencyCode
  type: EWebhookEvents.TRANSACTION_CONFIRMATIONS
  txid: string
  maxConfirmations: number
  network: ENetworkTypes
}
