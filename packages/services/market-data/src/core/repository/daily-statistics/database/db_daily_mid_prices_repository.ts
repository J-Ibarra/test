import { DBOrder, getModel } from '@abx-utils/db-connection-utils'
import { DepthMidPrice, MidPricesForSymbolsRequest } from '@abx-types/market-data'
import { DatabaseMidPriceRepository } from '../../mid-price/db_mid_price_repository'

export const findAllMidPricesForSymbols = async (symbolIds: string[], timeFilter: Date): Promise<Map<string, DepthMidPrice[]>> => {
  return DatabaseMidPriceRepository.getInstance().getMidPricesForSymbols(
    MidPricesForSymbolsRequest.createRequest({ symbolIds, from: timeFilter, createdAtOrder: DBOrder.DESC }),
  )
}

export const findLatestMidPriceForSymbol = async (symbolId: string): Promise<number> => {
  const midPriceInstance = await getModel<DepthMidPrice>('depth_mid_price').findOne({
    where: {
      symbolId,
    },
    order: [['createdAt', DBOrder.DESC]],
    limit: 1,
  })

  return midPriceInstance ? midPriceInstance.get().price : 0
}

export const findOldestMidPriceForSymbol = async (symbolId: string, from: Date): Promise<number> => {
  const midPriceInstance = await getModel<DepthMidPrice>('depth_mid_price').find({
    where: {
      symbolId,
      createdAt: { $gte: from },
    },
    order: [['createdAt', DBOrder.ASC]],
    limit: 1,
  })

  return midPriceInstance ? midPriceInstance.get().price : 0
}
