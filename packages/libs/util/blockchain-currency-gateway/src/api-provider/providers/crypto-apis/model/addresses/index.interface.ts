import { IGenerateAddressResponse, IAddressDetailsResponse ,IAddressDetailsResponseEth} from '../addresses'

export interface IAddresses {
  generateAddress: () => Promise<IGenerateAddressResponse>
  getInfo: (publicAddress: string) => Promise<IAddressDetailsResponse>
}


export interface IEthAddresses {
  generateAddress: () => Promise<IGenerateAddressResponse>
  getInfo: (publicAddress: string) => Promise<IAddressDetailsResponseEth>
}
