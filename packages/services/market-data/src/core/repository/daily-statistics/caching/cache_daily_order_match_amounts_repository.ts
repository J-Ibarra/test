import moment from 'moment'
import Decimal from 'decimal.js'

import { findOrderMatchTransactionsForSymbols, SYMBOL_TOTAL_TRADE_VOLUME } from '..'
import { MemoryCache } from '@abx-utils/db-connection-utils'
import { OrderMatch } from '@abx-types/order'

export const findAndStoreOrderMatchPrices = async (symbolIds: string[], timeFilter: Date) => {
  const orderMatchTransactions = await findOrderMatchTransactionsForSymbols(symbolIds, timeFilter)
  orderMatchTransactions.forEach((orderMatches: OrderMatch[], symbolId: string) => {
    const orderMatchTotalAmount = orderMatches.reduce((acc, { amount }) => acc + amount, 0)

    MemoryCache.getInstance().set<number>({
      key: SYMBOL_TOTAL_TRADE_VOLUME(symbolId),
      ttl: Math.abs(moment().diff(moment(timeFilter), 'ms')),
      val: orderMatchTotalAmount,
    })
  })
}

export const storeOrderMatchPrice = ({ symbolId, createdAt, amount }: Pick<OrderMatch, 'symbolId' | 'createdAt' | 'amount'>, timeFilter: Date) => {
  const totalRecordedTradeVolume = MemoryCache.getInstance().get<number>(SYMBOL_TOTAL_TRADE_VOLUME(symbolId)) || 0

  MemoryCache.getInstance().set<number>({
    key: SYMBOL_TOTAL_TRADE_VOLUME(symbolId),
    ttl: Math.abs(moment(createdAt).diff(moment(timeFilter), 'ms')),
    val: new Decimal(totalRecordedTradeVolume).add(amount).toNumber(),
  })
}
