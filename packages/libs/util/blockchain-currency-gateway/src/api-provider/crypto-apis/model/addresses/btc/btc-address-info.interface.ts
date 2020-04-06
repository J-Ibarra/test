import { PayloadWrapper } from '../../../model'

export interface IBtcAddressDetailsRequest {
  publicKey: string
}

export interface IBtcAddressDetailsResponse extends PayloadWrapper<IBtcAddressDetails> {}

export interface IBtcAddressDetails {
  address: string
  totalSpent: string
  totalReceived: string
  balance: string
  txi: number
  txo: number
  txsCount: number
  addresses: string[]
}
