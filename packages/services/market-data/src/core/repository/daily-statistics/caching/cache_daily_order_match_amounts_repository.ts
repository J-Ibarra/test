import moment = require('moment')

import { findOrderMatchTransactionsForSymbols, ORDER_MATCH_KEY } from '..'
import { CachingObject } from '../../../../../db/cache/memory-gateway'
import { getMemoryCacheClient } from '../../../../../db/memory'
import { OrderMatch } from '../../../../../orders/interface'

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
    getMemoryCacheClient().setList<number>(cachingOrderMatch)
  })
}

export const storeOrderMatchPrice = ({ symbolId, id, createdAt, amount }: OrderMatch, timeFilter: Date) =>
  getMemoryCacheClient().set<number>({
    key: `${ORDER_MATCH_KEY(symbolId)}:${id}`,
    ttl: moment(createdAt).diff(moment(timeFilter), 'ms'),
    val: amount,
  })
