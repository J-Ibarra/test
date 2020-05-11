import { getAskPriceForAllSymbols, getBidPriceForAllSymbols, getDailyChange, getDailyVolume } from '.'
import { getAllSymbolsIncludingCurrency, findSymbolsByAccountId } from '@abx-service-clients/reference-data'
import { CurrencyCode, SymbolPairStateFilter } from '@abx-types/reference-data'
import { SymbolMarketDataSnapshot } from '@abx-types/market-data'

export const getDailyMarketDataStats = async (symbolIds: string[]): Promise<SymbolMarketDataSnapshot[]> => {
  const askPriceForAllSymbols = getAskPriceForAllSymbols(symbolIds)
  const bidPriceForAllSymbols = getBidPriceForAllSymbols(symbolIds)
  const [dailyChangeForAllSymbols, dailyVolumeForAllSymbols] = await Promise.all([getDailyChange(symbolIds), getDailyVolume(symbolIds)])

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

export const getDailyMarketDataStatsForAllSymbols = async (accountId: string) => {
  const allSymbolsForAccount = await findSymbolsByAccountId(accountId)
  return getDailyMarketDataStats(allSymbolsForAccount.map(({ id }) => id))
}

export const getDailyMarketDataStatsForCurrency = async (currency: CurrencyCode, accountId: string) => {
  const [allSymbolsForCurrency, allSymbolsForAccount] = await Promise.all([
    getAllSymbolsIncludingCurrency(currency, SymbolPairStateFilter.all),
    findSymbolsByAccountId(accountId),
  ])
  const allSymbolsIdsForAccount = allSymbolsForAccount.map(({ id }) => id)

  const symbolsFilteredForAccount = allSymbolsForCurrency.filter(({ id }) => allSymbolsIdsForAccount.includes(id))

  return getDailyMarketDataStats(symbolsFilteredForAccount.map(({ id }) => id))
}
