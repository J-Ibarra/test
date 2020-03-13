import { PayloadWrapper } from '../../model'

export interface ITransactionDetailsRequest {
  txID: string
}

export interface ITransactionDetailsRequestEth {
  TX_HASH: string
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

export interface ITransactionDetailsResponseEth extends PayloadWrapper<IEthereumTransactionDetails> {}

export interface IEthereumTransactionDetails {
  chain: string
  status: string
  index: number
  hash: string
  value: number
  from: string
  to: string
  date: Date
  timestamp: number
  block_hash: number
  block_number: number
  gas: number
  gas_price: number
  gas_used: number
  nonce: number
  confirmations: number
  token_transfers: [
    {
      from: string
      to: string
      tokenName: string
      symbol: string
      tokenType: string
      tokenID: string
      value: number
    },
  ]
  input: string
}
