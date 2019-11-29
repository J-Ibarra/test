import { DepthItem } from './depth_item'

export interface AggregateDepth {
  symbolId: string
  buy: DepthItem[]
  sell: DepthItem[]
}
