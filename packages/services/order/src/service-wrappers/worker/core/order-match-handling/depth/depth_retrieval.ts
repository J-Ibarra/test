import { isEmpty } from 'lodash'

import { OrderDirection, OrderStatus } from '@abx-types/order'
import { findOrders } from '../../../../../core'
import { SymbolDepth } from '@abx-types/order'
import { getDepthFromCache } from './redis'

/**
 * Retrieves all the bid and ask open orders for a given symbol.
 * The orders are retrieved from permanent storage(db) only if they are not present in cache.
 *
 * @param symbolId the symbol ID
 * @param limit The upper bound on the number of buy and sell orders to retrieve.
 */
export async function getDepthForSymbol(symbolId: string, limit?: number): Promise<SymbolDepth> {
  const cachedDepth = await getDepthFromCache(symbolId)

  if (!isEmpty(cachedDepth[OrderDirection.buy]) || !isEmpty(cachedDepth[OrderDirection.sell])) {
    return {
      [OrderDirection.buy]: cachedDepth[OrderDirection.buy].slice(0, limit),
      [OrderDirection.sell]: cachedDepth[OrderDirection.sell].slice(0, limit),
    } as any
  }

  const [buyOrders, sellOrders] = await Promise.all([
    getOpenOrders(symbolId, OrderDirection.buy, limit),
    getOpenOrders(symbolId, OrderDirection.sell, limit),
  ])

  return {
    [OrderDirection.buy]: buyOrders,
    [OrderDirection.sell]: sellOrders,
  } as any
}

/** Gets all open buy or sell orders for a symbol. */
function getOpenOrders(symbolId: string, orderDirection: OrderDirection, limit: number | undefined) {
  return findOrders({
    where: {
      symbolId,
      direction: orderDirection,
      $and: [
        {
          status: {
            $not: OrderStatus.fill,
          },
        },
        {
          status: {
            $not: OrderStatus.cancel,
          },
        },
      ],
    },
    order: [orderDirection === OrderDirection.buy ? ['limitPrice', 'DESC'] : ['limitPrice', 'ASC']],
    limit,
  })
}
