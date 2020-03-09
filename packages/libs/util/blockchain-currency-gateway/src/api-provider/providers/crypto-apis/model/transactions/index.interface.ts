import { ITransactionDetailsResponse, ITransactionsFeeResponse, ITransactionSizeResponse ,IEthTransactionsFeeResponse,IEthTransactionsGasResponse,BroadcastTransactionResponseEth,ITransactionDetailsResponseEth} from '../transactions'
import { CreateTransactionResponse } from './create-transaction.interface'
import { IAddressDetailsResponseERC_20, IAddressBalanceResponseERC_20} from '../addresses'
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
  ) => Promise<CreateTransactionResponse>
  sendTransaction: (signedTransactionHex: string) => Promise<BroadcastTransactionResponse>
}

export interface IEthTransactions {
  getTransaction: (txID: string, queryParams?: any) => Promise<ITransactionDetailsResponseEth>
  getTransactionsFee: () => Promise<IEthTransactionsFeeResponse>
  estimateTransactionGas : (fromAddress: string,toAddress: string, value: number) => Promise<IEthTransactionsGasResponse>
  getTransactionSize: (
    inputs: { address: string; value: number }[],
    outputs: { address: string; value: number }[],
    fee: { address: string; value: number },
  ) => Promise<ITransactionSizeResponse>
  createTransaction: (
    fromAddress: string,
    toAddress: string,
    value: number,
    gasPrice: number,
    gasLimit: number,
    password?: string,
  ) => Promise<CreateTransactionResponse>
  sendTransaction: (fromAddress: string,toAddress: string, value: number) => Promise<BroadcastTransactionResponseEth>
  pushTransaction: (hex: string) => Promise<BroadcastTransactionResponseEth>
  
}

export interface IERC_20Transaction {
  transferTokens: (
    fromAddress: string,
    toAddress: string,
    gasPrice: number,
    gasLimit: number,
    token: number,
    contract: string,
    password?: string,
  ) => Promise<CreateTransactionResponse>
  getTokenTransactionsByAddress: (
    address: string
  ) => Promise<IAddressDetailsResponseERC_20>
  getAddressTokenBalance: (
    address: string,
    contract: string
  ) => Promise<IAddressBalanceResponseERC_20>
    
}
