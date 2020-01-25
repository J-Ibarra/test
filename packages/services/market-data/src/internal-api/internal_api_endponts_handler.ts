import { getEpicurusInstance, messageFactory } from '@abx/db-connection-utils'
import { MarketDataFacade } from '../core'
import { MarketDataEndpoints, getMidPricesForSymbol } from '@abx-service-clients/market-data'

export function bootstrapInternalApiEndpoints() {
  const epicurus = getEpicurusInstance()
  const marketDataServiceInstance = MarketDataFacade.getInstance()

  epicurus.server(
    MarketDataEndpoints.getMidPricesForSymbol,
    messageFactory(getMidPricesForSymbol, request => marketDataServiceInstance.getMidPricesForSymbol(request)),
  )
}
