import { DepthState, Order, OrderDirection } from '@abx-types/order'

export function getTopOrder(symbolId: string, depth: DepthState, direction: OrderDirection, accountId: string): Order | undefined {
  const now = new Date()
  return depth.orders[symbolId][direction].find(depthItem => {
    return accountId !== depthItem.accountId && (!depthItem.expiryDate || depthItem.expiryDate > now)
  })
}
