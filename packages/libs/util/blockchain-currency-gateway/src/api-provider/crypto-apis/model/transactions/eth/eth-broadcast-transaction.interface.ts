import { PayloadWrapper } from '../../payload-wrapper.interface'

export interface BroadcastTransactionResponseEth extends PayloadWrapper<BroadcastTransactionResponsePayloadEth> {}

export interface BroadcastTransactionResponsePayloadEth {
  hex: string
}
