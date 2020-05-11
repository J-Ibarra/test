import moment from 'moment'
import { findAllMidPricesForSymbols, MID_PRICE_LATEST_KEY, MID_PRICE_OLDEST_KEY } from '..'
import { MemoryCache } from '@abx-utils/db-connection-utils'
import { DepthMidPrice } from '@abx-types/market-data'

interface NewestAndOldestMarketDataPair {
  newest: DepthMidPrice
  oldest: DepthMidPrice
}

export const findAndStoreMidPrices = async (symbolIds: string[], timeFilter: Date) => {
  const midPrices = await findAllMidPricesForSymbols(symbolIds, timeFilter)
  const firstAndLastMidPriceForEachSymbol = groupNewestAndOldestMidPriceBySymbolId(midPrices)

  firstAndLastMidPriceForEachSymbol.forEach((midPricesForSymbol, symbolId) => storeMidPricesForSymbols(symbolId, midPricesForSymbol, timeFilter))
}

const groupNewestAndOldestMidPriceBySymbolId = (midPrices: Map<string, DepthMidPrice[]>): Map<string, NewestAndOldestMarketDataPair> => {
  const symbolIdToNewestAndOldestPrices = new Map<string, NewestAndOldestMarketDataPair>()

  midPrices.forEach((midPrices, symbolId) => {
    symbolIdToNewestAndOldestPrices.set(symbolId, {
      newest: midPrices[0],
      oldest: midPrices.length > 0 ? midPrices[midPrices.length - 1] : midPrices[0],
    })
  })

  return symbolIdToNewestAndOldestPrices
}

const storeMidPricesForSymbols = (symbolId: string, { newest, oldest }: NewestAndOldestMarketDataPair, timeFilter: Date) => {
  if (newest) {
    storeMidPrice(
      {
        symbolId,
        price: newest.price,
        createdAt: newest.createdAt,
      },
      timeFilter,
    )
  }

  if (oldest) {
    MemoryCache.getInstance().set<number>({
      key: `${MID_PRICE_OLDEST_KEY(symbolId)}`,
      ttl: Math.abs(moment(oldest.createdAt).diff(moment(timeFilter), 'ms')),
      val: oldest.price,
    })
  }
}

export const storeMidPrice = ({ symbolId, price, createdAt }: Pick<DepthMidPrice, 'symbolId' | 'price' | 'createdAt'>, timeFilter: Date) =>
  MemoryCache.getInstance().set<number>({
    key: `${MID_PRICE_LATEST_KEY(symbolId)}`,
    ttl: Math.abs(moment(createdAt).diff(moment(timeFilter), 'ms')),
    val: price,
  })
