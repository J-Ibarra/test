import { PayloadWrapper, ENetworkTypes, EWebhookEvents } from '../../model'
import { CurrencyCode } from '@abx-types/reference-data'

export interface IAddressTransactionConfirmationsWebhookRequest {
  callbackURL: string
  address: string
  confirmations: number
}

export interface IAddressTransactionConfirmationsWebookResponse extends PayloadWrapper<IAddressTransactionConfirmations> {}

export interface IAddressTransactionConfirmations {
  uuid: string
  event: EWebhookEvents.TRANSACTION_CONFIRMATIONS
  confirmations: number
  address: string
  url: string
  created: Date
  active: boolean
}

export interface IAddressTransactionConfirmationsEventPayload {
  currentConfirmations: number
  address: string
  blockHeight: number
  currency: CurrencyCode
  type: EWebhookEvents.TRANSACTION_CONFIRMATIONS
  txid: string
  maxConfirmations: number
  network: ENetworkTypes
}
