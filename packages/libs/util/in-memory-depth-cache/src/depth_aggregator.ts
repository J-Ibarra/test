import * as _ from 'lodash'
import { Order, OrderDirection } from '@abx-types/order'
import { DepthItem } from '@abx-types/depth-cache'

export function getAggregateDepth(orders: Order[], limit?: number): DepthItem[] {
  return _.chain(removeExpiredItems(orders))
    .groupBy('limitPrice')
    .map(groupedOrders => {
      return {
        amount: _.sumBy(groupedOrders, 'remaining'),
        price: groupedOrders[0].limitPrice || 0,
      }
    })
    .orderBy('price', _.get(orders, '[0].direction') === OrderDirection.buy ? 'desc' : 'asc')
    .slice(0, limit)
    .value()
}

function removeExpiredItems(depthItems: Order[]): Order[] {
  const now = new Date()
  return depthItems.filter(item => {
    return !item.expiryDate || new Date(String(item.expiryDate)) > now
  })
}
