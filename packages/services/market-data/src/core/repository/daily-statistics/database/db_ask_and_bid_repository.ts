import { isEmpty } from 'lodash'
import { SymbolMarketDataSnapshot } from '@abx-types/market-data'
import { OrderDirection } from '@abx-types/order'
import { getOpenOrders } from '@abx-service-clients/order'
import { reduceSymbolsToMappedObject } from '../../utils/helpers'

type returnTypeForAskAndBid = Map<string, Array<Pick<SymbolMarketDataSnapshot, 'askPrice' | 'bidPrice' | 'symbolId'>>>

export const findAskAndBidPricesForSymbols = async (symbolIds: string[]): Promise<returnTypeForAskAndBid> => {
  const allAskAndBids = await Promise.all(
    symbolIds.map(async symbolId => {
      const [buyOrder, sellOrder] = await Promise.all([
        getOpenOrders(symbolId, OrderDirection.buy, 1),
        getOpenOrders(symbolId, OrderDirection.sell, 1),
      ])
      return { symbolId, bidPrice: !isEmpty(buyOrder) ? buyOrder[0].limitPrice : 0, askPrice: !isEmpty(sellOrder) ? sellOrder[0].limitPrice : 0 }
    }),
  )

  return reduceSymbolsToMappedObject(allAskAndBids) as any
}
