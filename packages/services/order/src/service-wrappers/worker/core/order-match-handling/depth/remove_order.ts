import { Logger } from '@abx/logging'
import { DepthState, Order, OrderDirection } from '@abx-types/order'

const logger = Logger.getInstance('remove_order', 'removeOrderFromDepth')

/**
 * Attempts to remove an order from the order book.
 * Throws a {@link RuntimeError} if order not found.
 *
 * @param order the order to remove
 * @param depth the current depth
 * @returns true when order removed from top of the depth
 */
export function removeOrderFromDepth({ id, symbolId, direction }: Order, depth: DepthState): { orderRemoved: boolean; topOfDepthUpdated: boolean } {
  if (direction === OrderDirection.buy) {
    return removeFromDepth(depth.orders[symbolId][OrderDirection.buy], id!)
  }

  return removeFromDepth(depth.orders[symbolId][OrderDirection.sell], id!)
}

function removeFromDepth(orderList: Order[], orderId: number): { orderRemoved: boolean; topOfDepthUpdated: boolean } {
  const index = orderList.findIndex(depthItem => depthItem.id === orderId)
  const found = index > -1

  if (found) {
    orderList.splice(index, 1)

    return {
      orderRemoved: true,
      topOfDepthUpdated: index === 0,
    }
  }

  logger.warn(`Unable to find order id ${orderId} when removing from depth`)
  return {
    orderRemoved: false,
    topOfDepthUpdated: false,
  }
}
