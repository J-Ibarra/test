import moment from 'moment'

import { findOrderMatchTransactionsForSymbols, ORDER_MATCH_KEY } from '..'
import { MemoryCache, CachingObject } from '@abx/db-connection-utils'
import { OrderMatch } from '@abx-types/order'

export const findAndStoreOrderMatchPrices = async (symbolIds: string[], timeFilter: Date) => {
  const orderMatchTransactions = await findOrderMatchTransactionsForSymbols(symbolIds, timeFilter)
  orderMatchTransactions.forEach((orderMatches: OrderMatch[], symbolId: string) => {
    const cachingOrderMatch = orderMatches.map(
      ({ id, amount, createdAt }): CachingObject<number> => ({
        key: `${ORDER_MATCH_KEY(symbolId)}:${id}`,
        ttl: moment(createdAt).diff(moment(timeFilter), 'ms'),
        val: amount,
      }),
    )
    MemoryCache.getInstance().setList<number>(cachingOrderMatch)
  })
}

export const storeOrderMatchPrice = ({ symbolId, id, createdAt, amount }: OrderMatch, timeFilter: Date) =>
  MemoryCache.getInstance().set<number>({
    key: `${ORDER_MATCH_KEY(symbolId)}:${id}`,
    ttl: moment(createdAt).diff(moment(timeFilter), 'ms'),
    val: amount,
  })
