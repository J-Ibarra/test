import { IEthTransactionsFeeResponse, IEthTransactionsGasResponse } from './eth-transaction-fee.interface'
import { CreateTransactionResponse } from '../create-transaction-response.interface'
import { BroadcastTransactionResponseEth } from './eth-broadcast-transaction.interface'
import { ITransactionDetailsResponseEth } from './eth-transaction-details.interface'

export interface IEthTransactionOperations {
  getTransaction: (txID: string, queryParams?: any) => Promise<ITransactionDetailsResponseEth>
  getTransactionsFee: () => Promise<IEthTransactionsFeeResponse>
  estimateTransactionGas: (fromAddress: string, toAddress: string, value: number) => Promise<IEthTransactionsGasResponse>
  createTransaction: (
    fromAddress: string,
    toAddress: string,
    value: number,
    gasPrice: number,
    gasLimit: number,
    password?: string,
  ) => Promise<CreateTransactionResponse>
  sendTransaction: (fromAddress: string, toAddress: string, value: number) => Promise<BroadcastTransactionResponseEth>
  pushTransaction: (hex: string) => Promise<BroadcastTransactionResponseEth>
}
