import { DepthItem } from './depth_item.interface';

export interface DepthCacheSymbol {
    buy: DepthItem[]
    sell: DepthItem[]
  }