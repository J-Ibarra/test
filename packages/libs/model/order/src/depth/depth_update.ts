import { DepthItem } from '@abx-types/depth-cache'

export interface DepthUpdate {
  symbolId: string
  topOfDepthUpdated: boolean
  aggregateDepth: DepthItem[]
  oppositeDepthTopOrder: DepthItem
}
