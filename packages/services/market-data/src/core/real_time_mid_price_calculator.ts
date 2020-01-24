import { get, isEmpty } from 'lodash'
import { Transaction } from 'sequelize'

import { getInstance } from '../../db/epicurus'
import { DepthCache, DepthCacheSymbol } from '../../depth_cache/interface'
import { OrderDirection, OrderMatch } from '../../orders/interface'
import { SymbolDepth } from '../../orders/lib/depth/interface'
import { FiatCurrency, WalletSymbols } from '../../symbols'
import { findLastOrderMatchForSymbol } from '../../transactions/lib/find_order_match_transaction'
import { calculateMidPrice } from './repository/mid-price/mid_price_calc_utils'
import { DepthCacheFacade } from '@abx-utils/in-memory-depth-cache'

/**
 * Calculates the latest mid price based on the depth passed in.
 * This is used to compute the mid-price at the current moment while matching orders.
 * The mid-price is then sent to along with the order match details to the settlement process which uses it
 * @param symbolId
 * @param symbolDepth
 */
export async function calculateMidPriceForSymbol(
  symbolId: string,
  symbolDepth: SymbolDepth = { [OrderDirection.buy]: [], [OrderDirection.sell]: [] },
  transaction?: Transaction,
) {
  const buyDepthTop = symbolDepth[OrderDirection.buy][0] || { limitPrice: 0, amount: 0 }
  const sellDepthTop = symbolDepth[OrderDirection.sell][0] || { limitPrice: 0, amount: 0 }

  let midPrice = calculateMidPrice({
    buy: [{ price: buyDepthTop.limitPrice, amount: buyDepthTop.amount }],
    sell: [{ price: sellDepthTop.limitPrice, amount: sellDepthTop.amount }],
    symbolId,
  })

  if (midPrice === 0) {
    const latestOrderMatch = await findLastOrderMatchForSymbol(symbolId, transaction)

    midPrice = (latestOrderMatch && latestOrderMatch.matchPrice) || 0
  }

  return midPrice
}

/**
 * Retrieves the latest depth mid-price for a given symbol, driven-off the current order book.
 * IF the order book is empty, we use the latest trade match price.
 *
 * @param symbolId the ID of symbol to calculate the mid-price for
 */
export async function calculateRealTimeMidPriceForSymbol(symbolId: string): Promise<number> {
  const epicurus = getInstance()

  DepthCacheFacade.get
  const currentDepthForSymbol: DepthCacheSymbol = await epicurus.request(EpicurusRequestChannel.getDepthForCurrencyPair, { symbolId, limit: 1 })
  let midPrice = calculateMidPrice({ ...currentDepthForSymbol, symbolId })

  if (midPrice === 0) {
    const latestOrderMatch = await findLastOrderMatchForSymbol(symbolId)

    midPrice = (latestOrderMatch && latestOrderMatch.matchPrice) || 0
  }

  return midPrice
}

/**
 * Converts the real time midprices stored in a Map to an object, and sends the midprices in the response to the client.
 */
export async function convertRealTimeMidPriceForSymbolsToObject(): Promise<Record<string, number>> {
  const realTimeMidPrices: Record<string, number> = {}
  const realTimeMidPricesMap = await calculateRealTimeMidPriceForSymbols(Object.values(WalletSymbols))

  realTimeMidPricesMap.forEach((midPrice, symbolId) => {
    const walletCurrency = symbolId.replace(`_${FiatCurrency.usd}`, '')
    realTimeMidPrices[walletCurrency] = midPrice
  })

  return realTimeMidPrices
}

export async function calculateRealTimeMidPriceForSymbols(symbolIds: string[]): Promise<Map<string, number>> {
  const epicurus = getInstance()
  const currentDepthForSymbols: DepthCache = await epicurus.request(EpicurusRequestChannel.getDepthForCurrencyPairs, { symbolIds, limit: 1 })

  const symbolsWithoutDepth = symbolIds.filter(
    symbolId =>
      !currentDepthForSymbols[symbolId] || (isEmpty(currentDepthForSymbols[symbolId].buy) && isEmpty(currentDepthForSymbols[symbolId].sell)),
  )
  const latestOrderMatchesForNoDepthSymbols = await Promise.all(symbolsWithoutDepth.map(symbol => findLastOrderMatchForSymbol(symbol)))

  return symbolIds.reduce((symbolToMidPrice, symbolId) => {
    return symbolToMidPrice.set(
      symbolId,
      calculateMidPriceOrUseLatestMatchPrice(symbolId, symbolsWithoutDepth, latestOrderMatchesForNoDepthSymbols, currentDepthForSymbols),
    )
  }, new Map())
}

function calculateMidPriceOrUseLatestMatchPrice(
  symbolId: string,
  symbolsWithoutDepth: string[],
  latestOrderMatchesForSymbols: OrderMatch[],
  currentDepthForSymbols: DepthCache,
) {
  const symbolWithoutDepthIndex = symbolsWithoutDepth.indexOf(symbolId)

  if (symbolWithoutDepthIndex > -1) {
    return get(latestOrderMatchesForSymbols[symbolWithoutDepthIndex], 'matchPrice', 0)
  }

  return calculateMidPrice({ ...currentDepthForSymbols[symbolId], symbolId })
}
