import { IGenerateAddressResponse } from '../../addresses'
import { IAddressDetailsResponseEth } from './eth-address-info.interface'

export interface IEthAddressOperations {
  generateAddress: () => Promise<IGenerateAddressResponse>
  getInfo: (publicAddress: string) => Promise<IAddressDetailsResponseEth>
}
