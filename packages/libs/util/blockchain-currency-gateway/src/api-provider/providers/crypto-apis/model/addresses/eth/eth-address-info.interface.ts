import { PayloadWrapper } from '../../../model'

export interface IAddressDetailsRequestEth {
  address: string
}

export interface IAddressDetailsResponseEth extends PayloadWrapper<IAddressDetailsEth> {}

export interface IAddressDetailsEth {
  chain: string
  address: string
  balance: string
  txs_count: number
  from: number
  to: number
}
