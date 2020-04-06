import { PayloadWrapper } from '../../../model'

export interface IBtcTransactionSizeRequest {
  inputs: { address: string; value: number }[]
  outputs: { address: string; value: number }[]
  fee: { address: string; value: number }
  data?: string
}

export interface IBtcTransactionSizeResponse extends PayloadWrapper<IBtcTransactionSize> {}

export interface IBtcTransactionSize {
  tx_size_bytes: number
}
