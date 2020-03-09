import { PayloadWrapper } from '../../model'

export interface IAddressDetailsRequest {
  publicKey: string
}
export interface IAddressDetailsResponse extends PayloadWrapper<IAddressDetails> {}
export interface IAddressDetails {
  address: string
  totalSpent: string
  totalReceived: string
  balance: string
  txi: number
  txo: number
  txsCount: number
  addresses: string[]
}

// ETH

export interface IAddressDetailsRequestEth {
  address: string
  contract?: string
}
export interface IAddressDetailsResponseEth extends PayloadWrapper<IAddressDetailsEth> {}
export interface IAddressDetailsEth {
  chain: string,
  address: string,
  balance: string,
  txs_count: number,
  from: number,
  to: number
}

export interface IAddressDetailsResponseERC_20 extends PayloadWrapper<IAddressDetailsERC_20> {}
export interface IAddressDetailsERC_20 {
    meta: {totalCount: number; limit: number; results: number},
    payload: {txHash: string; datetime: Date; from: string; to: string; value: string; name: string; symbol: string; type: string }[]
}

export interface IAddressBalanceResponseERC_20 extends PayloadWrapper<IAddressBalanceERC_20> {}
export interface IAddressBalanceERC_20 {
    name: string,
    token: number,
    symbol: string
}