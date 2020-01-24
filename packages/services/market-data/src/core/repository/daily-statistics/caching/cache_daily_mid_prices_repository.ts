import moment = require('moment')
import { v4 } from 'node-uuid'
import { findAllMidPricesForSymbols, PRICE_CHANGE_KEY } from '..'
import { DepthMidPrice } from '../../../..'
import { getMemoryCacheClient } from '../../../../../db/memory'

export const findAndStoreMidPrices = async (symbolIds: string[], timeFilter: Date) => {
  const midPrices = await findAllMidPricesForSymbols(symbolIds, timeFilter)

  midPrices.forEach((midPricesForSymbol, symbolId) => {
    const cachingMidPrices = midPricesForSymbol.map(({ createdAt, price, id }) => ({
      key: `${PRICE_CHANGE_KEY(symbolId)}:${id}`,
      ttl: moment(createdAt).diff(moment(timeFilter), 'ms'),
      val: price,
    }))
    getMemoryCacheClient().setList<number>(cachingMidPrices)
  })
}

export const storeMidPrice = ({ id, symbolId, price, createdAt }: DepthMidPrice, timeFilter: Date) =>
  getMemoryCacheClient().set<number>({
    key: `${PRICE_CHANGE_KEY(symbolId)}:${id}`,
    ttl: moment(createdAt).diff(moment(timeFilter), 'ms'),
    val: price,
  })
