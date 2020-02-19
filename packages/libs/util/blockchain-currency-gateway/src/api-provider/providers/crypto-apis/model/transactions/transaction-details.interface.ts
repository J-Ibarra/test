import { PayloadWrapper } from '../../model'

export interface ITransactionDetailsRequest {
  txID: string
}

export interface ITransactionDetailsResponse extends PayloadWrapper<IBitcoinTransactionDetails> {}

export interface IBitcoinTransactionDetails {
  txid: string
  hash: string
  index: number
  version: number
  size: number
  vsize: number
  locktime: number
  time: Date
  blockhash: string
  blockheight: number
  blocktime: Date
  timestamp: number
  confirmations: number
  txins: [
    {
      txout: string
      vout: number
      amount: string
      addresses: string[]
      script: {
        asm: string
        hex: string
      }
      votype: string
    },
  ]
  txouts: [
    {
      amount: string
      type: string
      spent: boolean
      addresses: string[]
      script: {
        asm: string
        hex: string
        reqsigs: number
      }
    },
  ]
}
