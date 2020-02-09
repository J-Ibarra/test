import { PayloadWrapper, ENetworkTypes, EWebhookEvents } from '..'
import { CurrencyCode } from '@abx-types/reference-data'

export interface IConfirmationTransactionRequest {
  callbackURL: string
  transactionHash: string
  confirmations: number
}

export interface IConfirmationTransactionResponse extends PayloadWrapper<IConfirmationTransaction> {}

export interface IConfirmationTransaction {
  uuid: string
  event: EWebhookEvents.CONFIRMED_TX
  transaction: string
  confirmations: number
  url: string
  created: Date
  active: boolean
}

export interface IConfirmationTransactionEventPayload {
  blockHeight: number
  blockHash: string
  currency: CurrencyCode
  network: ENetworkTypes
  url: string
  type: EWebhookEvents.CONFIRMED_TX
  txid: string
  confirmations: number
}
