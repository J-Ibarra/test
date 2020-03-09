import { PayloadWrapper } from '..'

export interface BroadcastTransactionResponse extends PayloadWrapper<BroadcastTransactionResponsePayload> {}

export interface BroadcastTransactionResponsePayload {
  txid: string
}

export interface BroadcastTransactionResponseEth extends PayloadWrapper<BroadcastTransactionResponsePayloadEth> {}

export interface BroadcastTransactionResponsePayloadEth {
  hex: string
}
