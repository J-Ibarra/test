import { Logger } from '@abx/logging'
import { DepthState, Order, OrderDirection } from '@abx-types/order'

const logger = Logger.getInstance('lib', 'add_order')

export const addOrderToDepth = (newOrder: Order, depth: DepthState) => {
  const depthReference = depth.orders![newOrder.symbolId][newOrder.direction]
  let topOfDepthUpdated = false

  if (depthReference.length === 0) {
    depthReference.push(newOrder)
    topOfDepthUpdated = true
  } else {
    for (let i = 0; i < depthReference.length; i++) {
      if (shouldInsertNewOrderAheadOfDepthOrder(newOrder, depthReference[i])) {
        depthReference.splice(i, 0, newOrder)
        topOfDepthUpdated = i === 0
        break
      } else if (i === depthReference.length - 1) {
        depthReference.push(newOrder)
        break
      }
    }
  }

  logger.debug(`Broadcasting depth update for symbol ${newOrder.symbolId} (order: ${newOrder.id})`)
  depth.broadcast!.depthUpdated!(newOrder.symbolId, newOrder.direction, depth.orders![newOrder.symbolId], topOfDepthUpdated)
}

// Bid(buy) depth orders are ordered highest limit price to lowest
// Ask(sell) depth orders are ordered lowest limit price to highest
const shouldInsertNewOrderAheadOfDepthOrder = (newOrder: Order, depthOrder: Order) => {
  if (newOrder.direction === OrderDirection.buy) {
    return (newOrder.limitPrice || 0) > (depthOrder.limitPrice || 0)
  }

  return (newOrder.limitPrice || 0) < (depthOrder.limitPrice || 0)
}
