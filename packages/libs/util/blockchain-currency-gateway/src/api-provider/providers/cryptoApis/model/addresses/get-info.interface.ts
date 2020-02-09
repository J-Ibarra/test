import { PayloadWrapper } from '..'

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
