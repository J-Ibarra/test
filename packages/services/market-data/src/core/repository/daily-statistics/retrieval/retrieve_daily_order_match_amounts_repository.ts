import { getLatestMidPrice, SYMBOL_TOTAL_TRADE_VOLUME } from '..'
import { MemoryCache } from '@abx-utils/db-connection-utils'

export const getDailyVolume = async (symbolIds: string[]): Promise<Map<string, number>> => {
  const mapVolumesToSymbols = new Map<string, number>()

  await Promise.all(
    symbolIds.map(async (symbolId) => {
      const symbolsMidPrice = (await getLatestMidPrice(symbolId)) || 0
      const totalTradedAmountForSymbol = MemoryCache.getInstance().get<number>(SYMBOL_TOTAL_TRADE_VOLUME(symbolId)) || 0

      mapVolumesToSymbols.set(symbolId, totalTradedAmountForSymbol * symbolsMidPrice || 0)
    }),
  )

  return mapVolumesToSymbols
}
