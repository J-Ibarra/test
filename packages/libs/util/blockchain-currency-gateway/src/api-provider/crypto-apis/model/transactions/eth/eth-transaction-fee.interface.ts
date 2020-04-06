import { PayloadWrapper } from '../../payload-wrapper.interface'

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
