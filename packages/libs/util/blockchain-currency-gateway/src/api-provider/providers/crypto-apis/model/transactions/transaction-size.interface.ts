import { PayloadWrapper } from '../../model'

export interface ITransactionSizeRequest {
  inputs: { address: string; value: number }[]
  outputs: { address: string; value: number }[]
  fee: { address: string; value: number }
}

export interface ITransactionSizeResponse extends PayloadWrapper<ITransactionSize> {}

export interface ITransactionSize {
  tx_size_bytes: number
}
