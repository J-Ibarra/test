import { DBOrder, getModel } from '@abx/db-connection-utils'
import { DepthMidPrice, MidPricesForSymbolsRequest } from '@abx-types/market-data'
import { DatabaseMidPriceRepository } from '../../mid-price/db_mid_price_repository'

export const findAllMidPricesForSymbols = async (symbolIds: string[], timeFilter: Date): Promise<Map<string, DepthMidPrice[]>> => {
  return DatabaseMidPriceRepository.getInstance().getMidPricesForSymbols(new MidPricesForSymbolsRequest(symbolIds, timeFilter))
}

export const findLatestMidPriceForSymbol = async (symbolId: string): Promise<number> => {
  const midPriceInstance = await getModel<DepthMidPrice>('depth_mid_price').findAll({
    where: {
      symbolId,
    },
    order: [['createdAt', DBOrder.DESC]],
    limit: 1,
  })

  return midPriceInstance ? (midPriceInstance.map(price => price.get())[0] || { price: 0 }).price : 0
}
