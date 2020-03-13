export interface IInitialTransactionDetails {
  inputs: { address: string; value: number }[]
  outputs: { address: string; value: number }[]
  fee: { address: string; value: number }
  data?: string
}

export interface IInitialTransactionDetailsEth {
  fromAddress: string,
  toAddress: string,
  value: number,
  gasPrice: number,
  gasLimit: number,
  password: string
}