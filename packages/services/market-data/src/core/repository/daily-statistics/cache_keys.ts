/** The top of the ask. */
export const ASK_PRICE_KEY = (symbolId: string) => `exchange:stats:ask:${symbolId}`

/** The top of the bid. */
export const BID_PRICE_KEY = (symbolId: string) => `exchange:stats:bid:${symbolId}`

/** The total traded amount for a given symbol. */
export const SYMBOL_TOTAL_TRADE_VOLUME = (symbolId: string) => `exchange:stats:volume:${symbolId}`

/** The latest mid price for a given symbol. */
export const MID_PRICE_LATEST_KEY = (symbolId: string) => `exchange:stats:mid-price:latest:${symbolId}`

/** The oldest 24h Mid Price for a given symbol. */
export const MID_PRICE_OLDEST_KEY = (symbolId: string) => `exchange:stats:mid-price:oldest:${symbolId}`
