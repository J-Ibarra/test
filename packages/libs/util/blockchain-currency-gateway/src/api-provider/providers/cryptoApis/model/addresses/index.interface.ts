import { IGenerateAddressResponse, IAddressDetailsResponse } from '.'

export interface IAddresses {
  generateAddress: () => Promise<IGenerateAddressResponse>
  getInfo: (publicAddress: string) => Promise<IAddressDetailsResponse>
}
