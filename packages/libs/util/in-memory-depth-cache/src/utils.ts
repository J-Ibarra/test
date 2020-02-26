import * as _ from 'lodash'
import { Order, OrderDirection } from '@abx-types/order'
import { DepthItem } from '@abx-types/depth-cache'
import Decimal from 'decimal.js'

export function getAggregateDepth(orders: Order[], limit?: number): DepthItem[] {
  return _.chain(removeExpiredItems(orders))
    .groupBy('limitPrice')
    .map(groupedOrders => {
      return {
        amount: groupedOrders.reduce((prev, { remaining }) => new Decimal(remaining).plus(prev).toNumber(), 0),
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

/**
 * Enriches {@link DepthItem} with an {@code ownedAmount} flag which would be set
 * to the quantity owned by the account making the request.
 * E.g if we have an aggregated depth item with price: 10 and amount: 20
 * which represents 2 orders:
 * - first has an amount of 14
 * - second has an amount of 6
 * If the second one is owned by the account making the request,
 * the {@code ownedAmount} would be set to 6.
 */
export interface DepthItemWithOwnMarker {
  amount: number
  price: number
  ownedAmount: number
}

export function enrichWithOwnedAmount(aggregateDepth: DepthItem[], ordersForAccount: Order[]): DepthItemWithOwnMarker[] {
  const orderPriceToAmount = ordersForAccount.reduce((acc, { limitPrice, remaining }) => {
    if (!acc[limitPrice!]) {
      acc[limitPrice!] = remaining
    } else {
      acc[limitPrice!] = new Decimal(acc[limitPrice!]).plus(remaining).toNumber()
    }
    return acc
  }, {} as Record<number, number>)

  return aggregateDepth.reduce((acc, depthItem) => {
    acc.push({
      price: depthItem.price,
      amount: depthItem.amount,
      ownedAmount: orderPriceToAmount[depthItem.price] || 0,
    })

    return acc
  }, [] as DepthItemWithOwnMarker[])
}
