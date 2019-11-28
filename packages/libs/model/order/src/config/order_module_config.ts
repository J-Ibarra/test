import { Order } from '../core/order'
import { DepthUpdate } from '../depth/depth_update'
import { OrderMatch } from '../core/order_match'

export interface OrderModuleConfig {
  broadcastOrderUpdated: (order: Order) => void
  broadcastOrderMatched: (orderMatch: OrderMatch) => void
  broadcastBidDepthUpdated: (depthUpdate: DepthUpdate) => void
  broadcastAskDepthUpdated: (depthUpdate: DepthUpdate) => void
}
