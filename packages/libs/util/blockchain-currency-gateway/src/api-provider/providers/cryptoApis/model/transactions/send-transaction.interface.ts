import { PayloadWrapper } from '..'

export interface ISendTransactionRequest {
  hex: string
}
export interface ISendTransactionResponse extends PayloadWrapper<ISendTransaction> {}
export interface ISendTransaction {
  txid: string
}
