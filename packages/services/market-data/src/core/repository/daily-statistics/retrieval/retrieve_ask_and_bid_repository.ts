import { ASK_PRICE_KEY, BID_PRICE_KEY } from '..'
import { MemoryCache } from '@abx/db-connection-utils'

export const getBidPriceForAllSymbols = (symbolIds: string[]): Map<string, number> =>
  symbolIds.reduce((accumulator, symbolId) => {
    accumulator.set(symbolId, getBidPriceForSymbol(symbolId))
    return accumulator
  }, new Map<string, number>())

export const getAskPriceForAllSymbols = (symbolIds: string[]): Map<string, number> =>
  symbolIds.reduce((accumulator, symbolId) => {
    accumulator.set(symbolId, getAskPriceForSymbol(symbolId))
    return accumulator
  }, new Map<string, number>())

export const getBidPriceForSymbol = (symbolId: string): number => MemoryCache.getInstance().get<number>(BID_PRICE_KEY(symbolId)) || 0
export const getAskPriceForSymbol = (symbolId: string): number => MemoryCache.getInstance().get<number>(ASK_PRICE_KEY(symbolId)) || 0
