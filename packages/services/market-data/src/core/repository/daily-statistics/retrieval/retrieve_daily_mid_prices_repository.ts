import { findLatestMidPriceForSymbol, MID_PRICE_LATEST_KEY, MID_PRICE_OLDEST_KEY } from '..'
import { MemoryCache } from '@abx-utils/db-connection-utils'
import { findOldestMidPriceForSymbol } from '../database'
import moment from 'moment'
import { isNullOrUndefined } from 'util'

export const getDailyChange = async (symbolIds: string[]): Promise<Map<string, number>> => {
  const symbolDailyChange = await Promise.all(symbolIds.map(calculateDailyChangeForSymbol))
  return new Map<string, number>(symbolDailyChange)
}

const calculateDailyChangeForSymbol = async (symbolId: string): Promise<[string, number]> => {
  const [latestMidPrice, oldestMidPrice] = await Promise.all([getLatestMidPrice(symbolId), getOldestMidPrice(symbolId)])

  const dailyChangeForSymbol =
    latestMidPrice === oldestMidPrice || oldestMidPrice === 0 ? latestMidPrice / 100 : (latestMidPrice - oldestMidPrice) / oldestMidPrice

  return [symbolId, dailyChangeForSymbol]
}

export const getLatestMidPrice = async (symbolId: string) => {
  let latestMidPrice = MemoryCache.getInstance().get<number>(MID_PRICE_LATEST_KEY(symbolId))

  if (isNullOrUndefined(latestMidPrice)) {
    latestMidPrice = await findLatestMidPriceForSymbol(symbolId)
    MemoryCache.getInstance().set<number>({
      key: MID_PRICE_LATEST_KEY(symbolId),
      ttl: Math.abs(moment().diff(moment().subtract(1, 'day'), 'ms')),
      val: latestMidPrice,
    })
  }

  return latestMidPrice
}

export const getOldestMidPrice = async (symbolId: string) => {
  let oldestMidPrice = MemoryCache.getInstance().get<number>(MID_PRICE_OLDEST_KEY(symbolId))

  if (isNullOrUndefined(oldestMidPrice)) {
    oldestMidPrice = await findOldestMidPriceForSymbol(symbolId, moment().subtract(1, 'days').toDate())
    MemoryCache.getInstance().set<number>({
      key: MID_PRICE_OLDEST_KEY(symbolId),
      ttl: Math.abs(moment().diff(moment().subtract(1, 'day'), 'ms')),
      val: oldestMidPrice,
    })
  }

  return oldestMidPrice
}
