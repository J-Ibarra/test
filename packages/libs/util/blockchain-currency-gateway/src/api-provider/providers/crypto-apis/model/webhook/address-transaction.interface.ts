import { ENetworkTypes } from '../network/network-types.enum'
import { EWebhookEvents } from './webhook.enum'
import { CurrencyCode } from '@abx-types/reference-data'
import { PayloadWrapper } from '../../model'

export interface IAddressTransactionRequest {
  callbackURL: string
  address: string
  confirmations: number
}

export interface IAddressTransactionResponse extends PayloadWrapper<IAddressTransaction> {}

export interface IAddressTransaction {
  uuid: string
  event: EWebhookEvents.ADDRESS
  confirmations: number
  address: string
  url: string
  created: Date
  active: boolean
}

export interface IAddressTransactionEventPayload {
  currency: CurrencyCode
  network: ENetworkTypes
  url: string
  type: EWebhookEvents.ADDRESS
  blockHeight: number
  blockHash: string
  confirmations: number
  address: string
  txid: string
}

export interface IAddressTokenTransactionResponse extends PayloadWrapper<IAddressTokenTransaction> {}

export interface IAddressTokenTransaction {
  uuid: string
  event: EWebhookEvents.TOKEN
  confirmations: number
  address: string
  url: string
  created: Date
}

export interface IAddressTokenTransactionEventPayload {
  address: string
  token_name: string
  block: number
  txHash: string
  token_symbol: string
  type: EWebhookEvents.TOKEN
  contract: string
  value: string
  currency: CurrencyCode
  network: ENetworkTypes
  url: string
  confirmations: number
  direction: IAddressTokenTransactionEventPayloadDirection
}

export enum IAddressTokenTransactionEventPayloadDirection {
  sender = 'sender',
  receiver = 'receiver',
}
