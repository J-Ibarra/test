import { PayloadWrapper } from '../../payload-wrapper.interface'

export interface ITransactionDetailsRequestEth {
  TX_HASH: string
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
