import { DepthState, Order, OrderDirection } from '@abx-types/order'

export function getOrder(depth: DepthState, symbolId: string, orderId: number): Order | undefined {
  return getFromDepth(depth.orders[symbolId][OrderDirection.sell]) || getFromDepth(depth.orders[symbolId][OrderDirection.buy])

  function getFromDepth(orderList: Order[]): Order | undefined {
    return orderList.find(depthItem => depthItem.id === orderId)
  }
}
