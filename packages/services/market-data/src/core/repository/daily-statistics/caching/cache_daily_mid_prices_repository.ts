import moment from 'moment'
import { findAllMidPricesForSymbols, PRICE_CHANGE_KEY } from '..'
import { MemoryCache } from '@abx-utils/db-connection-utils'
import { DepthMidPrice } from '@abx-types/market-data'

export const findAndStoreMidPrices = async (symbolIds: string[], timeFilter: Date) => {
  const midPrices = await findAllMidPricesForSymbols(symbolIds, timeFilter)

  midPrices.forEach((midPricesForSymbol, symbolId) => {
    const cachingMidPrices = midPricesForSymbol.map(({ createdAt, price, id }) => ({
      key: `${PRICE_CHANGE_KEY(symbolId)}:${id}`,
      ttl: moment(createdAt).diff(moment(timeFilter), 'ms'),
      val: price,
    }))
    MemoryCache.getInstance().setList<number>(cachingMidPrices)
  })
}

export const storeMidPrice = ({ id, symbolId, price, createdAt }: DepthMidPrice, timeFilter: Date) =>
  MemoryCache.getInstance().set<number>({
    key: `${PRICE_CHANGE_KEY(symbolId)}:${id}`,
    ttl: moment(createdAt).diff(moment(timeFilter), 'ms'),
    val: price,
  })
