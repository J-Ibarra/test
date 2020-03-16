import { INetworkGroups, ENetworkTypes } from '../../model'
import { IBtcTransactionOperations, IEthTransactionOperations } from '../transactions'
import { IEthAddressOperations, IBtcAddressOperations, IErc20AddressOperations } from '../addresses'
import { IGenericWebhookOperations, IEthWebhookOperations } from '../webhook'

export type BtcCoin = ICoin<IBtcAddressOperations, IBtcTransactionOperations>

export interface ICoin<T, K, V = IGenericWebhookOperations> {
  NETWORKS: INetworkGroups
  switchNetwork: (networkType: ENetworkTypes) => void
  address: T
  webhook: V
  transaction: K
}

export interface EthCoin extends ICoin<IEthAddressOperations, IEthTransactionOperations, IEthWebhookOperations> {
  token: IErc20AddressOperations
}
