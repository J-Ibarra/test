import { PayloadWrapper } from '..'

export interface BroadcastTransactionResponse extends PayloadWrapper<BroadcastTransactionResponsePayload> {}

export interface BroadcastTransactionResponsePayload {
  txid: string
}
