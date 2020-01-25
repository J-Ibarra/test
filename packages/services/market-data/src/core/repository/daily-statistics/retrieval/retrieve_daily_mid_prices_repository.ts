import { head, isEmpty, last } from 'lodash'
import { findLatestMidPriceForSymbol, PRICE_CHANGE_KEY } from '..'
import { MemoryCache } from '@abx/db-connection-utils'

export const getDailyChange = async (symbolIds: string[]): Promise<Map<string, number>> => {
  const symbolDailyChange = await Promise.all(symbolIds.map(calculateDailyChangeForSymbol))
  return new Map<string, number>(symbolDailyChange)
}

const calculateDailyChangeForSymbol = async (symbolId: string): Promise<[string, number]> => {
  let allMidPrices = MemoryCache.getInstance().getList<number>(PRICE_CHANGE_KEY(symbolId))
  if (isEmpty(allMidPrices)) {
    allMidPrices = [await findLatestMidPriceForSymbol(symbolId)]
  }

  const latestMidPrice = getLatestMidPrice(symbolId, allMidPrices)
  const oldestMidPrice = getOldestMidPrice(symbolId, allMidPrices)
  const dailyChangeForSymbol = latestMidPrice === oldestMidPrice ? latestMidPrice : (latestMidPrice - oldestMidPrice) / oldestMidPrice

  return [symbolId, dailyChangeForSymbol]
}

export const getLatestMidPrice = (symbolId: string, allMidPrices = MemoryCache.getInstance().getList<number>(PRICE_CHANGE_KEY(symbolId))) =>
  head(allMidPrices) || 0

export const getOldestMidPrice = (symbolId: string, allMidPrices = MemoryCache.getInstance().getList<number>(PRICE_CHANGE_KEY(symbolId))) =>
  last(allMidPrices) || 0
