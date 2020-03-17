export interface IBtcCreateTransactionRequest {
  inputs: { address: string; value: number }[]
  outputs: { address: string; value: number }[]
  fee: { address: string; value: number }
  data?: string
}
