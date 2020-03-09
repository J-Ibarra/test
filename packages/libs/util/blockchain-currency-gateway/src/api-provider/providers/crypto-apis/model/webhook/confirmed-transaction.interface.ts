import { PayloadWrapper, ENetworkTypes, EWebhookEvents } from '../../model'
import { CurrencyCode } from '@abx-types/reference-data'

export interface IConfirmedTransactionWebhookRequest {
  callbackURL: string
  transactionHash: string
  confirmations: number
}

export interface IConfirmedTransactionWebhookResponse extends PayloadWrapper<IConfirmedTransaction> {}

export interface IConfirmedTransaction {
  uuid: string
  event: EWebhookEvents.CONFIRMED_TX
  transaction: string
  confirmations: number
  url: string
  created: Date
  active: boolean
}

export interface IConfirmedTransactionEventPayload {
  blockHeight: number
  blockHash: string
  currency: CurrencyCode
  network: ENetworkTypes
  url: string
  type: EWebhookEvents.CONFIRMED_TX
  txid: string
  confirmations: number
}

//ETH

export interface IConfirmedTransactionWebhookRequestEth {
  callbackURL: string
  transactionHash: string
  confirmations: number
}

export interface IConfirmedTransactionWebhookResponseEth extends PayloadWrapper<IConfirmedTransactionEth> {}

export interface IConfirmedTransactionEth {
  uuid: string
  event: EWebhookEvents.ADDRESS
  confirmations: number
  transaction: string
  url: string
  created: Date
}

export interface IConfirmedTransactionEventPayloadEth {
  blockHeight: number
  blockHash: string
  currency: CurrencyCode
  network: ENetworkTypes
  url: string
  type: EWebhookEvents.CONFIRMED_TX
  txid: string
  confirmations: number
}
