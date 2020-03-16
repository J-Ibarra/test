import { PayloadWrapper } from '../../payload-wrapper.interface'

export interface IAddressBalanceResponseERC_20 extends PayloadWrapper<IAddressBalanceERC_20> {}
export interface IAddressBalanceERC_20 {
  name: string
  token: number
  symbol: string
}
