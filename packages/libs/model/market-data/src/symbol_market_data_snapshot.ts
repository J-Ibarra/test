/** Defines market information for a symbol at a given point in time. */
export interface SymbolMarketDataSnapshot {
  /** The ID of the symbol. */
  symbolId: string
  /** The highest bid price. */
  bidPrice: number
  /** The lowest ask price. */
  askPrice: number
  /** The percent change between the mid-price now and the mid price 24h ago. */
  dailyChange: number
  /** The amount traded (both buy/sell transactions) * the current mid-price. */
  dailyVolume: number
}
