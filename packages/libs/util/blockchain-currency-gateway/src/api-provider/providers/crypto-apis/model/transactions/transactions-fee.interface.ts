import { PayloadWrapper } from '../../model'

export interface ITransactionsFeeResponse extends PayloadWrapper<ITransactionsFee> {}
export interface ITransactionsFee {
  min: string
  max: string
  average: string
  min_fee_per_byte: string
  average_fee_per_byte: string
  max_fee_per_byte: string
  unit: string
}

export interface IEthTransactionsFeeResponse extends PayloadWrapper<IEthTransactionsFee> {}
export interface IEthTransactionsFee {
  min: string
  max: string
  average: string
  recommended: string
  unit: string
}

export interface IEthTransactionsGasResponse extends PayloadWrapper<IEthTransactionsGas> {}
export interface IEthTransactionsGas {
  gasLimit: string
}
