import { sum } from 'lodash'
import { getLatestMidPrice, ORDER_MATCH_KEY } from '..'
import { MemoryCache } from '@abx-utils/db-connection-utils'

export const getDailyVolume = (symbolIds: string[]): Map<string, number> => {
  const mapVolumesToSymbols = new Map<string, number>()
  symbolIds.forEach(symbolId => {
    const symbolsMidPrice = getLatestMidPrice(symbolId) || 0
    const orderMatchesInCache = MemoryCache.getInstance().getList<number>(ORDER_MATCH_KEY(symbolId))
    const totalAmount = sum(orderMatchesInCache)
    mapVolumesToSymbols.set(symbolId, totalAmount * symbolsMidPrice || 0)
  })

  return mapVolumesToSymbols
}
