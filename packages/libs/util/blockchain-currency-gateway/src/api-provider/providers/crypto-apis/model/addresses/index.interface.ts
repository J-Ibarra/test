import { IGenerateAddressResponse, IAddressDetailsResponse } from '../addresses'

export interface IAddresses {
  generateAddress: () => Promise<IGenerateAddressResponse>
  getInfo: (publicAddress: string) => Promise<IAddressDetailsResponse>
}
