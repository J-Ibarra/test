import { INetworkGroups, ENetworkTypes, IAddresses, IWebhooks, ITransactions ,IEthAddresses, IEthTransactions, IERC_20Transaction ,IEthWebhooks} from '../../model'

export interface ICoins {
  ETH: IEth
  BTC: ICoin
  BCH: ICoin
  LTC: ICoin
  DOGE: ICoin
  DASH: ICoin
  USDT: ICoin
}

export interface ICoin {
  NETWORKS: INetworkGroups
  switchNetwork: (networkType: ENetworkTypes) => void
  address: IAddresses
  webhook: IWebhooks
  transaction: ITransactions
}

export interface IEth {
  NETWORKS: INetworkGroups
  switchNetwork: (networkType: ENetworkTypes) => void
  address: IEthAddresses
  webhook: IEthWebhooks
  transaction: IEthTransactions
  token: IERC_20Transaction
}
