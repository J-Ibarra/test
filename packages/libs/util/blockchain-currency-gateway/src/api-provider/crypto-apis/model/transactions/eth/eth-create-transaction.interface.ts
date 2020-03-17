export interface IEthCreateTransactionRequest {
  fromAddress: string
  toAddress: string
  value: number
  gasPrice: number
  gasLimit: number
  password: string
}
