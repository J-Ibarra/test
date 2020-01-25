import { get, isEmpty } from 'lodash'
import { getEpicurusInstance } from '@abx/db-connection-utils'
import { OrderMatch } from '@abx-types/order'
import { DepthMidPrice, MidPricesForSymbolRequest } from '@abx-types/market-data'

import { MarketDataEndpoints } from './endpoints'
import { calculateMidPrice } from './mid_price_calculator'
import { DepthCacheFacade } from '@abx-utils/in-memory-depth-cache'

import { findLastOrderMatchForSymbol, findLastOrderMatchForSymbols } from '@abx-service-clients/order'
import { DepthCacheSymbol } from '@abx-types/depth-cache'

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

export async function getMidPricesForSymbol(request: MidPricesForSymbolRequest): Promise<DepthMidPrice[]> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(MarketDataEndpoints.getMidPricesForSymbol, { request })
}

export * from './endpoints'
export * from './mid_price_calculator'
