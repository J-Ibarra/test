import { Controller, Get, Query, Route, Security } from 'tsoa'
import { Logger } from '@abx/logging'
import { getApiCacheClient } from '@abx/db-connection-utils'
import { MarketDataTimeFrame, OHLCMarketData, SymbolMarketDataSnapshot } from '@abx-types/market-data'
import { CurrencyCode } from '@abx-types/reference-data'
import { MARKET_DATA_SNAPSHOT_CACHE_KEY, MarketDataFacade, CURRENCY_MARKET_DATA_SNAPSHOT_CACHE_KEY } from '../core'
import { ApiErrorPayload } from '@abx-types/error'
import { getOHLCMarketData } from '../core'
import { wrapWithErrorHandling } from '@abx/express-middleware'

@Route('market-data')
export class MarketDataController extends Controller {
  private logger = Logger.getInstance('api', 'MarketDataController')
  private readonly marketDataServiceInstance = MarketDataFacade.getInstance()

  @Get('/ohlc')
  public async getOHLCMarketData(
    @Query() symbolId: string,
    @Query() timeFrame: MarketDataTimeFrame,
    @Query() fromDate: Date,
  ): Promise<OHLCMarketData[] | ApiErrorPayload> {
    return wrapWithErrorHandling<OHLCMarketData[]>(() => getOHLCMarketData(symbolId, Number(timeFrame), fromDate), this.setStatus)
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/snapshots/all')
  public async getMarketDataSnapshotForAllCurrencies(): Promise<SymbolMarketDataSnapshot[] | ApiErrorPayload> {
    this.logger.info('Retrieving market data snapshot for all currency pairs.')

    const cachedResponse: SymbolMarketDataSnapshot[] | false | null = await getApiCacheClient().getCache(MARKET_DATA_SNAPSHOT_CACHE_KEY)

    if (cachedResponse) {
      return cachedResponse
    }

    return this.marketDataServiceInstance.getMarketDataSnapshotForAllSymbols()
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/snapshots/{currency}')
  public async getMarketDataSnapshotForCurrency(currency: CurrencyCode): Promise<SymbolMarketDataSnapshot[] | ApiErrorPayload> {
    const cachedResponse: SymbolMarketDataSnapshot[] | false | null = await getApiCacheClient().getCache(
      `${CURRENCY_MARKET_DATA_SNAPSHOT_CACHE_KEY}-${currency}`,
    )

    if (cachedResponse) {
      return cachedResponse
    }

    return this.marketDataServiceInstance.getMarketDataSnapshotForCurrency(currency)
  }
}
