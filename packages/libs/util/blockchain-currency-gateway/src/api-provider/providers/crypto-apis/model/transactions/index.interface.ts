import { ITransactionDetailsResponse, ITransactionsFeeResponse, ITransactionSizeResponse } from '../transactions'
import { CreateTransactionResponse } from './create-transaction.interface'
import { BroadcastTransactionResponse } from './broadcast-transaction.interface'

export interface ITransactions {
  getTransaction: (txID: string, queryParams?: any) => Promise<ITransactionDetailsResponse>
  getTransactionsFee: () => Promise<ITransactionsFeeResponse>
  getTransactionSize: (
    inputs: { address: string; value: number }[],
    outputs: { address: string; value: number }[],
    fee: { address: string; value: number },
  ) => Promise<ITransactionSizeResponse>
  createTransaction: (
    inputs: { address: string; value: number }[],
    outputs: { address: string; value: number }[],
    fee: { address: string; value: number },
    optData?: { data: string },
  ) => Promise<CreateTransactionResponse>
  sendTransaction: (signedTransactionHex: string) => Promise<BroadcastTransactionResponse>
}
