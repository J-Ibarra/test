import { DepthItem } from '@abx-types/depth-cache'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepthMidPrice, MidPricesForSymbolRequest, MidPricesForSymbolsRequest, SymbolMarketDataSnapshot } from '@abx-types/market-data'
import { getDailyMarketDataStatsForAllSymbols, getDailyMarketDataStatsForCurrency } from './repository/daily-statistics'
import { CacheFirstMidPriceRepository, MidPriceRepository } from './repository/mid-price'

export const MARKET_DATA_SNAPSHOT_CACHE_KEY = 'market-data-snapshots-all'
export const CURRENCY_MARKET_DATA_SNAPSHOT_CACHE_KEY = 'market-data-snapshots-'

// TODO Refactor the mid-price logic out in a separate facade module
/** Defines the data facade exposing market operations. */
export class MarketDataFacade {
  private static instance: MarketDataFacade

  /** Creates and returns a {@link MarketDataFacade} instance, if one already created returns that. */
  public static getInstance(): MarketDataFacade {
    if (!this.instance) {
      this.instance = new MarketDataFacade()
    }

    return this.instance
  }

  constructor(private midPriceRepository: MidPriceRepository = CacheFirstMidPriceRepository.getInstance()) {}

  public recordDepthMidPriceChange(symbolId: string, bidDepthTopItem: DepthItem, askDepthTopItem: DepthItem): Promise<DepthMidPrice | null> {
    return this.midPriceRepository.recordDepthMidPriceChange(symbolId, bidDepthTopItem, askDepthTopItem)
  }

  public getMidPricesForSymbols(request: MidPricesForSymbolsRequest): Promise<Map<string, DepthMidPrice[]>> {
    return this.midPriceRepository.getMidPricesForSymbols(request)
  }

  public getMidPricesForSymbol(request: MidPricesForSymbolRequest): Promise<DepthMidPrice[]> {
    return this.midPriceRepository.getMidPricesForSymbol(request)
  }

  public async getMarketDataSnapshotForAllSymbols(): Promise<SymbolMarketDataSnapshot[]> {
    return getDailyMarketDataStatsForAllSymbols()
  }

  public async getMarketDataSnapshotForCurrency(currency: CurrencyCode): Promise<SymbolMarketDataSnapshot[]> {
    return getDailyMarketDataStatsForCurrency(currency)
  }
}
