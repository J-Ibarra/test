import { OrderDepth } from '../depth/order_depth'
import { OrderDirection } from '../core/order_direction.enum'
import { Order } from '../core/order'

export interface DepthState {
  orders?: OrderDepth
  broadcast?: {
    depthUpdated?: (symbolId: string, direction: OrderDirection, updatedDepth: Record<OrderDirection, Order[]>, topOfDepthUpdated: boolean) => void
  }
  command?: {
    resetExpiryTimer?: () => void
  }
  muted?: boolean
}
