import { getEpicurusInstance, messageFactory } from '@abx/db-connection-utils'
import { MarketDataFacade, reconcileOHCLMarketData } from '../core'
import { MarketDataEndpoints } from '@abx-service-clients/market-data'
import { cleanOldMidPricesSchema, getMidPricesForSymbolSchema, reconcileOHCLMarketDataSchema } from './schemas'
import { CacheFirstMidPriceRepository } from '../core'

export function bootstrapInternalApiEndpoints() {
  const epicurus = getEpicurusInstance()
  const marketDataServiceInstance = MarketDataFacade.getInstance()

  epicurus.server(
    MarketDataEndpoints.getMidPricesForSymbol,
    messageFactory(getMidPricesForSymbolSchema, request => marketDataServiceInstance.getMidPricesForSymbol(request)),
  )

  epicurus.server(
    MarketDataEndpoints.cleanOldMidPrices,
    messageFactory(cleanOldMidPricesSchema, () => CacheFirstMidPriceRepository.getInstance().cleanOldMidPrices()),
  )

  epicurus.server(
    MarketDataEndpoints.reconcileOHCLMarketData,
    messageFactory(reconcileOHCLMarketDataSchema, ({ timeFrame }) => reconcileOHCLMarketData(timeFrame)),
  )
}
