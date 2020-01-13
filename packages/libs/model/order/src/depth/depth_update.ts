import { DepthItem } from '@abx-types/depth-cache'
import { Order } from '../core'

export interface DepthUpdate {
  symbolId: string
  topOfDepthUpdated: boolean
  aggregateDepth: DepthItem[]
  oppositeDepthTopOrder: DepthItem
  ordersFromDepth: Order[]
}
