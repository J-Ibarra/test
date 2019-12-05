import { DepthItem } from './depth_item'

export interface DepthCacheSymbol {
  buy: DepthItem[]
  sell: DepthItem[]
}
