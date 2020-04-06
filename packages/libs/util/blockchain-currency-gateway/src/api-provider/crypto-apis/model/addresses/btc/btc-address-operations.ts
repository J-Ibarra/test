import { IGenerateAddressResponse } from '../../addresses'
import { IBtcAddressDetailsResponse } from './btc-address-info.interface'

export interface IBtcAddressOperations {
  generateAddress: () => Promise<IGenerateAddressResponse>
  getInfo: (publicAddress: string) => Promise<IBtcAddressDetailsResponse>
}
