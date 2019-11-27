/** The time frames that the OHLC is computed for. */
export enum MarketDataTimeFrame {
    oneMinute = 1,
    fiveMinutes = 5,
    fifteenMinutes = 15,
    thirtyMinutes = 30,
    oneHour = 60,
    fourHours = 240,
    sixHours = 360,
    twelveHours = 720,
    twentyFourHours = 1440
  }
  
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