import { findIndex, head, isEmpty } from 'lodash'
import moment from 'moment'
import { Logger } from '@abx-utils/logging'
import { DBOrder, getCacheClient, CacheGateway } from '@abx-utils/db-connection-utils'
import { DepthItem } from '@abx-types/depth-cache'
import { SymbolPair, SymbolPairStateFilter } from '@abx-types/reference-data'
import { getAllCompleteSymbolDetails } from '@abx-service-clients/reference-data'
import { DepthMidPrice, MidPricesForSymbolRequest, MidPricesForSymbolsRequest } from '@abx-types/market-data'
import { storeMidPrice } from '../daily-statistics'
import { DatabaseMidPriceRepository } from './db_mid_price_repository'
import { MidPriceRepository } from './mid_price_repository'

const cacheKeyPrefix = 'exchange:mid-price:'

/** Defines a Cache-first proxy which looks the data up into the cache first before going to durable storage. */
export class CacheFirstMidPriceRepository implements MidPriceRepository {
  private logger = Logger.getInstance('lib', 'CacheFirstMidPriceRepository')

  /** Creates and returns a {@link CacheFirstMidPriceRepository} instance, if one already created returns that. */
  public static getInstance(): CacheFirstMidPriceRepository {
    if (!this.instance) {
      this.instance = new CacheFirstMidPriceRepository()
    }

    return this.instance
  }

  private static instance: CacheFirstMidPriceRepository

  constructor(
    private cacheGateway: CacheGateway = getCacheClient(),
    private permanentStorage: MidPriceRepository = new DatabaseMidPriceRepository(),
  ) {}

  /**
   * Records a mid price change in cache and durable storage.
   * The mid price will only be recorded if it differs from the last recorded mid price.
   *
   * @param aggregateDepth contains the latest bid and ask prices for a symbol
   */
  public async recordDepthMidPriceChange(symbolId: string, bidDepthTopOrder: DepthItem, askDepthTopOrder: DepthItem): Promise<DepthMidPrice | null> {
    this.logger.debug(`Recording Mid-price change for ${symbolId}`)

    let midPrice: DepthMidPrice | null = null

    const latestRecordedMidPrice = await this.getMidPricesForSymbol(MidPricesForSymbolRequest.forSymbolAndLimit(symbolId, 1, DBOrder.DESC))

    midPrice = await this.permanentStorage.recordDepthMidPriceChange(symbolId, bidDepthTopOrder, askDepthTopOrder)

    if (latestRecordedMidPrice.length === 0 || latestRecordedMidPrice[0].price !== midPrice!.price) {
      await this.cacheGateway.addValueToTailOfList<DepthMidPrice>(`${cacheKeyPrefix}${symbolId}`, midPrice!)
    }

    process.nextTick(() => storeMidPrice(midPrice!, moment().subtract(24, 'hours').toDate()))
    return midPrice
  }

  /**
   * Uses the cache to retrieve the mid prices for a symbol.
   * If the cache is empty durable storage(Db) is used to retrieve the data which is then used to update the cache.
   * Order is oldest to newest
   *
   * @param request the req
   */
  public async getMidPricesForSymbol(request: MidPricesForSymbolRequest): Promise<DepthMidPrice[]> {
    this.logger.info(`Retrieving mid-price information for ${request.symbolId}`)

    const cachedMidPricesForSymbol = await this.cacheGateway.getList<DepthMidPrice>(
      `${cacheKeyPrefix}${request.symbolId}`,
      0,
      request.limit ? -request.limit : 0,
    )

    if (!isEmpty(cachedMidPricesForSymbol)) {
      this.logger.debug(`Retrieved mid-price information for ${request.symbolId} from cache`)
      const filteredMidPrices = cachedMidPricesForSymbol.filter((cachedMidPrice) => moment(cachedMidPrice.createdAt).isAfter(request.from))
      return filteredMidPrices.length > 0 ? filteredMidPrices : cachedMidPricesForSymbol.slice(-1)
    }

    const persistedMidPrices = await this.permanentStorage.getMidPricesForSymbol(request)

    if (!isEmpty(persistedMidPrices)) {
      this.logger.debug(`Retrieved mid-price information for ${request.symbolId} from db`)
      await this.cacheGateway.addValueToTailOfList<DepthMidPrice>(`${cacheKeyPrefix}${request.symbolId}`, ...persistedMidPrices)
      return persistedMidPrices
    }
    return []
  }

  /**
   * Retrieves all mid prices for a set of symbols (using cache first logic) for a given time frame.
   *
   * @param request the IDs of the symbols to retrieve the prices for
   */
  public async getMidPricesForSymbols(request: MidPricesForSymbolsRequest): Promise<Map<string, DepthMidPrice[]>> {
    const symbolMidPrices: DepthMidPrice[][] = await Promise.all(
      request.symbolIds.map((symbolId) =>
        this.getMidPricesForSymbol({
          symbolId,
          from: request.from,
          transaction: request.transaction,
          limit: request.limit,
        }),
      ),
    )

    return symbolMidPrices.reduce((symbolToPricesMap, depthMidPrices) => {
      return !isEmpty(depthMidPrices) ? symbolToPricesMap.set(head(depthMidPrices)!.symbolId, depthMidPrices) : symbolToPricesMap
    }, new Map<string, DepthMidPrice[]>())
  }

  /**
   * Uses the cache to retrieve the mid prices for a symbol for OHLC data.
   * If the cache is empty durable storage(Db) is used to retrieve the data which is then used to update the cache.
   * Order is oldest to newest
   *
   * @param request the req
   */
  public async getOHLCOrderedMidPricesForSymbol(request: MidPricesForSymbolRequest): Promise<DepthMidPrice[]> {
    this.logger.info(`Retrieving mid-price information for ${request.symbolId} for OHLC`)

    const midPriceTemp = await this.getMidPricesForSymbol(request)

    if (!isEmpty(midPriceTemp)) {
      return midPriceTemp
    }

    const createdAtOrder = DBOrder.DESC
    const latestMidPriceInDB = await this.permanentStorage.getMidPricesForSymbol(
      new MidPricesForSymbolRequest(request.symbolId, request.from, 1, request.transaction, createdAtOrder),
    )
    if (!isEmpty(latestMidPriceInDB)) {
      this.logger.debug(`Use the latest mid-price information for ${request.symbolId} from db for OHLC`)
      return latestMidPriceInDB
    }

    return []
  }

  /**
   * Retrieves all mid prices for a set of symbols (using cache first logic) for a given time frame for OHLC data
   *
   * @param request the IDs of the symbols to retrieve the prices for
   */
  public async getOHLCOrderedMidPricesForSymbols(request: MidPricesForSymbolsRequest): Promise<Map<string, DepthMidPrice[]>> {
    const symbolMidPrices: DepthMidPrice[][] = await Promise.all(
      request.symbolIds.map((symbolId) =>
        this.getOHLCOrderedMidPricesForSymbol({
          symbolId,
          from: request.from,
          transaction: request.transaction,
          limit: request.limit,
        }),
      ),
    )

    return symbolMidPrices.reduce((symbolToPricesMap, depthMidPrices) => {
      return !isEmpty(depthMidPrices) ? symbolToPricesMap.set(head(depthMidPrices)!.symbolId, depthMidPrices) : symbolToPricesMap
    }, new Map<string, DepthMidPrice[]>())
  }

  /** For each symbol evicts the mid-prices cached more than 24hours ago. */
  public async cleanOldMidPrices(): Promise<void> {
    this.logger.info(`Cleaning all old mid-prices`)
    const symbols = await getAllCompleteSymbolDetails(SymbolPairStateFilter.all)

    const midPriceCleanupForAllSymbols = symbols.map((symbol) => this.cleanOldMidPricesForSymbol(symbol))

    await Promise.all(midPriceCleanupForAllSymbols)
  }

  private async cleanOldMidPricesForSymbol({ id }: SymbolPair): Promise<void> {
    const midPrices = await this.cacheGateway.getList<DepthMidPrice>(`${cacheKeyPrefix}${id}`)

    const indexOfFirstMidPriceWithExpiredDate = findIndex(midPrices, ({ createdAt }) => moment(createdAt).isBefore(moment().subtract(24, 'hours')))

    return this.cacheGateway.trimList(`${cacheKeyPrefix}${id}`, 0, indexOfFirstMidPriceWithExpiredDate)
  }
}
