import { PayloadWrapper } from '../../../model'

export interface IBtcTransactionDetailsRequest {
  txID: string
}

export interface IBtcTransactionDetailsResponse extends PayloadWrapper<IBtcTransactionDetails> {}

export interface IBtcTransactionDetails {
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
