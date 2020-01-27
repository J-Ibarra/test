import { ASK_PRICE_KEY, BID_PRICE_KEY, findAskAndBidPricesForSymbols } from '..'
import { MemoryCache } from '@abx/db-connection-utils'

export const findAndStoreAskAndBidPrices = async (symbolIds: string[]) => {
  const orderDepth = await findAskAndBidPricesForSymbols(symbolIds)
  symbolIds.forEach(symbolId => {
    const [orderDepthForSymbol] = orderDepth.get(symbolId) || [
      {
        askPrice: 0,
        bidPrice: 0,
      },
    ]
    storeBidPrice(orderDepthForSymbol.bidPrice || 0, symbolId)
    storeAskPrice(orderDepthForSymbol.askPrice || 0, symbolId)
  })
}

export const storeBidPrice = (bidPrice: number, symbolId: string) =>
  MemoryCache.getInstance().set<number>({
    key: BID_PRICE_KEY(symbolId),
    val: bidPrice,
  })

export const storeAskPrice = (askPrice: number, symbolId: string) =>
  MemoryCache.getInstance().set<number>({
    key: ASK_PRICE_KEY(symbolId),
    val: askPrice,
  })
