import { get, isEmpty } from 'lodash'
import { OrderMatch } from '@abx-types/order'
import { DepthMidPrice, MidPricesForSymbolRequest, MarketDataTimeFrame } from '@abx-types/market-data'

import { MarketDataEndpoints } from './endpoints'
import { calculateMidPrice } from './mid_price_calculator'
import { DepthCacheFacade } from '@abx-utils/in-memory-depth-cache'

import { findLastOrderMatchForSymbol, findLastOrderMatchForSymbols } from '@abx-service-clients/order'
import { DepthCacheSymbol } from '@abx-types/depth-cache'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'

const MARKET_DATA_REST_API_PORT = 3110

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(MARKET_DATA_REST_API_PORT)

export async function calculateRealTimeMidPriceForSymbol(symbolId: string): Promise<number> {
  const depthCache = await DepthCacheFacade.createDepthCacheForAllSymbols()
  const depthForSymbol = await depthCache.getDepthForCurrencyPair(symbolId, 1)

  let midPrice = calculateMidPrice({ ...depthForSymbol, symbolId })

  if (midPrice === 0) {
    const latestOrderMatch = await findLastOrderMatchForSymbol(symbolId)

    midPrice = (latestOrderMatch && latestOrderMatch.matchPrice) || 0
  }

  return midPrice
}

export async function calculateRealTimeMidPriceForSymbols(symbolIds: string[]): Promise<Map<string, number>> {
  const depthCache = await DepthCacheFacade.createDepthCacheForAllSymbols()
  const currentDepthForSymbols = await depthCache.getDepthForCurrencyPairs(symbolIds, 1)

  const symbolsWithoutDepth = symbolIds.filter(
    symbolId =>
      !currentDepthForSymbols[symbolId] || (isEmpty(currentDepthForSymbols[symbolId].buy) && isEmpty(currentDepthForSymbols[symbolId].sell)),
  )
  const latestOrderMatchesForNoDepthSymbols = await findLastOrderMatchForSymbols(symbolsWithoutDepth)

  return symbolIds.reduce((symbolToMidPrice, symbolId) => {
    return symbolToMidPrice.set(
      symbolId,
      calculateMidPriceOrUseLatestMatchPrice(symbolId, symbolsWithoutDepth, latestOrderMatchesForNoDepthSymbols, currentDepthForSymbols[symbolId]),
    )
  }, new Map())
}

function calculateMidPriceOrUseLatestMatchPrice(
  symbolId: string,
  symbolsWithoutDepth: string[],
  latestOrderMatchesForSymbols: Map<string, OrderMatch | null>,
  currencyDepthForSymbol: DepthCacheSymbol,
): number {
  const symbolWithoutDepthIndex = symbolsWithoutDepth.indexOf(symbolId)

  if (symbolWithoutDepthIndex > -1) {
    return get(latestOrderMatchesForSymbols[symbolId], 'matchPrice', 0)
  }

  return calculateMidPrice({ ...currencyDepthForSymbol, symbolId })
}

export async function cleanOldMidPrices(): Promise<void> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<void>(MarketDataEndpoints.cleanOldMidPrices)
}

export async function reconcileOHCLMarketData(timeFrame: MarketDataTimeFrame): Promise<void> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<void>(MarketDataEndpoints.cleanOldMidPrices, { timeFrame })
}

export async function getMidPricesForSymbol(request: MidPricesForSymbolRequest): Promise<DepthMidPrice[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<DepthMidPrice[]>(MarketDataEndpoints.cleanOldMidPrices, { ...request })
}

export * from './endpoints'
export * from './mid_price_calculator'
