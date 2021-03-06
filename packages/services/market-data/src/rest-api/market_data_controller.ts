import { Controller, Get, Query, Route, Security, Tags, Request } from 'tsoa'
import { Logger } from '@abx-utils/logging'
import { MarketDataTimeFrame, OHLCMarketData, SymbolMarketDataSnapshot } from '@abx-types/market-data'
import { CurrencyCode } from '@abx-types/reference-data'
import { MarketDataFacade } from '../core'
import { ApiErrorPayload } from '@abx-types/error'
import { getOHLCMarketData } from '../core'
import { wrapWithErrorHandling } from '@abx-utils/express-middleware'
import { OverloadedRequest } from '@abx-types/account'

@Tags('market-data')
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
  public async getMarketDataSnapshotForAllCurrencies(@Request() request: OverloadedRequest): Promise<SymbolMarketDataSnapshot[] | ApiErrorPayload> {
    this.logger.info('Retrieving market data snapshot for all currency pairs.')

    return this.marketDataServiceInstance.getMarketDataSnapshotForAllSymbols(request.account!.id!)
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/snapshots/{currency}')
  public async getMarketDataSnapshotForCurrency(
    currency: CurrencyCode,
    @Request() request: OverloadedRequest,
  ): Promise<SymbolMarketDataSnapshot[] | ApiErrorPayload> {
    return this.marketDataServiceInstance.getMarketDataSnapshotForCurrency(currency, request.account!.id!)
  }
}
