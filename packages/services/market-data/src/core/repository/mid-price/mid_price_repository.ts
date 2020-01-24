import { Transaction } from 'sequelize'

import { AggregateDepth, DepthItem, OrderDirection } from '../../../../orders/interface'
import { DepthMidPrice, MidPricesForSymbolRequest, MidPricesForSymbolsRequest } from '../../../interface'

/** The mechanism used for {@link DepthMidPrice} data CRUD operations. */
export interface MidPriceRepository {
  /**
   * Retrieves the depth mid-prices history for a symbol, ordered from oldest to newest, for a given symbol from a given date onwards.
   * If no depth is present at the current moment it will return the last mid-price ever recorded.
   *
   * @param symbolId the symbol to retrieve the mid-prices for
   * @param from defines the time frame that the data should be retrieved for
   * @param t transaction to use, if present
   * @returns the mid-prices
   */
  getMidPricesForSymbol(request: MidPricesForSymbolRequest): Promise<DepthMidPrice[]>

  /**
   * Retrieves a {symbolId -> depth mid prices(ordered from oldest to newest)} history map
   * for all symbols for a given time frame driven by {@link from}.
   * If no depth is present at the current moment it will return the last mid-price ever recorded.
   *
   * @param from defines the time frame that the data should be retrieved for
   * @param t transaction to use, if present
   * @returns a {symbolId -> depth mid prices} map
   */
  getMidPricesForSymbols(request: MidPricesForSymbolsRequest): Promise<Map<string, DepthMidPrice[]>>

  /**
   * Uses the {@link aggregateDepth} to compute a depth mid-price.
   * The mid price is calculated using - (highest bid + highest ask) / 2
   */
  recordDepthMidPriceChange(symbolId: string, bidDepthTopItem: DepthItem, askDepthTopItem: DepthItem, t?: Transaction): Promise<DepthMidPrice | null>

  getOHLCOrderedMidPricesForSymbol?(request: MidPricesForSymbolRequest): Promise<DepthMidPrice[]>
  getOHLCOrderedMidPricesForSymbols?(request: MidPricesForSymbolsRequest): Promise<Map<string, DepthMidPrice[]>>
}
