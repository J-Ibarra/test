import { PayloadWrapper, IInitialTransactionDetails } from '..'

export interface ICreateTransactionRequest extends IInitialTransactionDetails {
  data?: string
  replaceable?: boolean
  locktime?: number
}
export interface ICreateTransactionResponse extends PayloadWrapper<ICreateTransaction> {}
export interface ICreateTransaction {
  hex: string
}
