import { Transaction } from 'sequelize'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { OrderDirection, SymbolDepth } from '@abx-types/order'
import { DepthMidPrice, MidPricesForSymbolRequest } from '@abx-types/market-data'

import { MarketDataEndpoints } from './endpoints'

export async function calculateRealTimeMidPriceForSymbol(symbolId: string): Promise<number> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(MarketDataEndpoints.calculateRealTimeMidPriceForSymbol, { symbolId })
}

export async function calculateMidPriceForSymbol(
  symbolId: string,
  symbolDepth: SymbolDepth = { [OrderDirection.buy]: [], [OrderDirection.sell]: [] },
  transaction?: Transaction,
) {
  const epicurus = getEpicurusInstance()

  return epicurus.request(MarketDataEndpoints.calculateMidPriceForSymbol, { symbolId, symbolDepth, transaction })
}

export async function calculateRealTimeMidPriceForSymbols(symbolIds: string[]): Promise<Map<string, number>> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(MarketDataEndpoints.calculateRealTimeMidPriceForSymbols, { symbolIds })
}

export async function getMidPricesForSymbol(request: MidPricesForSymbolRequest): Promise<DepthMidPrice[]> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(MarketDataEndpoints.getMidPricesForSymbol, { request })
}

export * from './endpoints'
