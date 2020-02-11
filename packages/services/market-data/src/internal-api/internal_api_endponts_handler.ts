import { MarketDataFacade, reconcileOHCLMarketData } from '../core'
import { MarketDataEndpoints } from '@abx-service-clients/market-data'
import { CacheFirstMidPriceRepository } from '../core'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createQueryEndpointHandlers(): InternalRoute<any, any>[] {
  const marketDataServiceInstance = MarketDataFacade.getInstance()

  return [
    {
      path: MarketDataEndpoints.getMidPricesForSymbol,
      handler: request => marketDataServiceInstance.getMidPricesForSymbol(request),
    },
    {
      path: MarketDataEndpoints.cleanOldMidPrices,
      handler: () => CacheFirstMidPriceRepository.getInstance().cleanOldMidPrices(),
    },
    {
      path: MarketDataEndpoints.reconcileOHCLMarketData,
      handler: ({ timeFrame }) => reconcileOHCLMarketData(timeFrame),
    },
  ]
}
