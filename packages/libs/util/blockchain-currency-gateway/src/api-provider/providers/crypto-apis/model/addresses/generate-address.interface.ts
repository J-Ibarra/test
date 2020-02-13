import { PayloadWrapper } from '../../model'

export interface IGenerateAddressResponse extends PayloadWrapper<IGenerateAddress> {}

export interface IGenerateAddress {
  privateKey: string
  publicKey: string
  wif: string
  address: string
}
