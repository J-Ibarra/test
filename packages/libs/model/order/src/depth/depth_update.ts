import { DepthItem } from './depth_item'

export interface DepthUpdate {
  symbolId: string
  topOfDepthUpdated: boolean
  aggregateDepth: DepthItem[]
  oppositeDepthTopOrder: DepthItem
}
