import { PayloadWrapper } from '../../../model'

export interface IBtcBroadcastTransactionResponse extends PayloadWrapper<IBtcBroadcastTransactionResponsePayload> {}

export interface IBtcBroadcastTransactionResponsePayload {
  txid: string
}
