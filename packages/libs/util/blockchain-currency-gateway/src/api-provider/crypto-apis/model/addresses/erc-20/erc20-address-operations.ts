import { IAddressBalanceResponseERC_20 } from './erc20-address-info.interface'

export interface IErc20AddressOperations {
  getAddressTokenBalance: (publicAddress: string, contract: string) => Promise<IAddressBalanceResponseERC_20>
}
