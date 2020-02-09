import {
  ITransactionDetailsResponse,
  ITransactionsFeeResponse,
  ITransactionSizeResponse,
  ISignTransactionResponse,
  ICreateTransactionResponse,
  ISendTransactionResponse,
} from '.'

export interface ITransactions {
  getTransaction: (txID: string, queryParams?: any) => Promise<ITransactionDetailsResponse>
  getTransactionsFee: () => Promise<ITransactionsFeeResponse>
  getTransactionSize: (
    inputs: { address: string; value: number }[],
    outputs: { address: string; value: number }[],
    fee: { address: string; value: number }[],
  ) => Promise<ITransactionSizeResponse>
  signTransaction: (hex: string, wifs: string[]) => Promise<ISignTransactionResponse>
  createTransaction: (
    inputs: { address: string; value: number }[],
    outputs: { address: string; value: number }[],
    fee: { address: string; value: number }[],
  ) => Promise<ICreateTransactionResponse>
  sendTransaction: (hex: string) => Promise<ISendTransactionResponse>
}
