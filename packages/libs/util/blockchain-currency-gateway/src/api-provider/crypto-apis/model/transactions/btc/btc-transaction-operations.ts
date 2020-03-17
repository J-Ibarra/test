import { CreateTransactionResponse } from '../create-transaction-response.interface'
import { IBtcBroadcastTransactionResponse } from './btc-broadcast-transaction.interface'
import { IBtcTransactionDetailsResponse } from './btc-transaction-details.interface'
import { IBtcTransactionsFeeResponse } from './btc-transactions-fee.interface'
import { IBtcTransactionSizeResponse } from './btc-transaction-size.interface'

export interface IBtcTransactionOperations {
  getTransaction: (txID: string, queryParams?: any) => Promise<IBtcTransactionDetailsResponse>
  getTransactionsFee: () => Promise<IBtcTransactionsFeeResponse>
  getTransactionSize: (
    inputs: { address: string; value: number }[],
    outputs: { address: string; value: number }[],
    fee: { address: string; value: number },
  ) => Promise<IBtcTransactionSizeResponse>
  createTransaction: (
    inputs: { address: string; value: number }[],
    outputs: { address: string; value: number }[],
    fee: { address: string; value: number },
    optData?: { data: string },
  ) => Promise<CreateTransactionResponse>
  sendTransaction: (signedTransactionHex: string) => Promise<IBtcBroadcastTransactionResponse>
}
