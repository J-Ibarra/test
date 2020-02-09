import { INetworkGroups, ENetworkTypes, IAddresses, IWebhooks, ITransactions } from '..'

export interface ICoins {
  ETH: ICoin
  BTC: ICoin
  BCH: ICoin
  LTC: ICoin
  DOGE: ICoin
  DASH: ICoin
}
export interface ICoin {
  NETWORKS: INetworkGroups
  switchNetwork: (networkType: ENetworkTypes) => void
  address: IAddresses
  webhook: IWebhooks
  transactions: ITransactions
}
