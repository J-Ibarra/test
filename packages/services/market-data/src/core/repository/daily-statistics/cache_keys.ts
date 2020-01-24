export const ASK_PRICE_KEY = (symbolId: string) => `exchange:stats:ask:${symbolId}`
export const BID_PRICE_KEY = (symbolId: string) => `exchange:stats:bid:${symbolId}`
export const ORDER_MATCH_KEY = (symbolId: string) => `exchange:stats:volume:${symbolId}`
export const PRICE_CHANGE_KEY = (symbolId: string) => `exchange:stats:change:${symbolId}`
