import { MarketDataTimeFrame } from './market_data_time_frame'

/** Contains the OHLC market data for a given {@link Currencies} for a timeFrame */
export interface OHLCMarketData {
  /** The trade symbol(driven by 'base' and 'to' currency ids). */
  symbolId: string
  /** The price at the start of the time frame that the instance covers. */
  open: number
  /** The highest price throughout the time frame that the instance covers. */
  high: number
  /** The lowest price throughout the time frame that the instance covers. */
  low: number
  /** The price at the end of the time frame that the instance covers. */
  close: number
  /** D§efines the data refresh time frame. */
  timeFrame: MarketDataTimeFrame
  /** The time the data was recorded. */
  createdAt: Date
}
