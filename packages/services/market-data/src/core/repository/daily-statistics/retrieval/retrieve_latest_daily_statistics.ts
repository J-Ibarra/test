import { getAskPriceForAllSymbols, getBidPriceForAllSymbols, getDailyChange, getDailyVolume } from '.'
import { getAllCompleteSymbolDetails, getAllSymbolsIncludingCurrency } from '@abx-service-clients/reference-data'
import { CurrencyCode, SymbolPairStateFilter } from '@abx-types/reference-data'
import { SymbolMarketDataSnapshot } from '@abx-types/market-data'

export const getDailyMarketDataStats = async (symbolIds: string[]): Promise<SymbolMarketDataSnapshot[]> => {
  const askPriceForAllSymbols = getAskPriceForAllSymbols(symbolIds)
  const bidPriceForAllSymbols = getBidPriceForAllSymbols(symbolIds)
  const dailyChangeForAllSymbols = await getDailyChange(symbolIds)
  const dailyVolumeForAllSymbols = getDailyVolume(symbolIds)

  return symbolIds.map(
    (symbolId: string): SymbolMarketDataSnapshot => {
      return {
        symbolId,
        dailyChange: dailyChangeForAllSymbols.get(symbolId) || 0,
        dailyVolume: dailyVolumeForAllSymbols.get(symbolId) || 0,
        askPrice: askPriceForAllSymbols.get(symbolId) || 0,
        bidPrice: bidPriceForAllSymbols.get(symbolId) || 0,
      }
    },
  )
}

export const getDailyMarketDataStatsForAllSymbols = async () => {
  const allSymbols = await getAllCompleteSymbolDetails(SymbolPairStateFilter.all)
  return getDailyMarketDataStats(allSymbols.map(({ id }) => id))
}
export const getDailyMarketDataStatsForCurrency = async (currency: CurrencyCode) => {
  const allSymbols = await getAllSymbolsIncludingCurrency(currency, SymbolPairStateFilter.all)
  return getDailyMarketDataStats(allSymbols.map(({ id }) => id))
}
