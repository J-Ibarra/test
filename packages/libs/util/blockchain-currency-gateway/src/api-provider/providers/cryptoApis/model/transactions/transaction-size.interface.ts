import { PayloadWrapper, IInitialTransactionDetails } from '..'

export interface ITransactionSizeRequest extends IInitialTransactionDetails {}
export interface ITransactionSizeResponse extends PayloadWrapper<ITransactionSize> {}
export interface ITransactionSize {
  tx_size_bytes: number
}
