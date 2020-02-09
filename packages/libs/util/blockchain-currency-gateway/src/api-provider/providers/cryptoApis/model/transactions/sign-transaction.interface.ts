import { PayloadWrapper } from '..'

export interface ISignTransactionRequest {
  hex: string
  wifs: string[]
}
export interface ISignTransactionResponse extends PayloadWrapper<ISignTransaction> {}
export interface ISignTransaction {
  hex: string
  completed: boolean
}
