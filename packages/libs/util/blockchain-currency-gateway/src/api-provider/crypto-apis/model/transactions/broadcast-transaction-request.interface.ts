import { IBtcBroadcastTransactionResponsePayload } from './btc'
import { BroadcastTransactionResponsePayloadEth } from './eth'

export type IBroadcastTransactionResponsePayload = IBtcBroadcastTransactionResponsePayload | BroadcastTransactionResponsePayloadEth
