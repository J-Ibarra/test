import { Logger } from '@abx-utils/logging'
import { getCacheClient } from '@abx-utils/db-connection-utils'
import { Order, OrderDirection } from '@abx-types/order'
import { SymbolDepth } from '@abx-types/order'

const depthPrefix = 'exchange:symbol:depth:'
const parseExpiryDate = (order: Order): Order => ({
  ...order,
  expiryDate: order.expiryDate ? new Date(order.expiryDate) : undefined,
})
const logger = Logger.getInstance('lib', 'depth-redis')

// Retrieves depth from redis. If no depth is present,
// returns an empty depth.
export async function getDepthFromCache(symbol: string): Promise<SymbolDepth> {
  const depth = await getCacheClient().get<SymbolDepth>(`${depthPrefix}${symbol}`)
  logger.debug(`Retrieved depth from redis for ${symbol}`)

  if (depth == null) {
    return {
      [OrderDirection.buy]: [],
      [OrderDirection.sell]: [],
    } as any
  }

  return {
    [OrderDirection.buy]: depth[OrderDirection.buy].map(parseExpiryDate),
    [OrderDirection.sell]: depth[OrderDirection.sell].map(parseExpiryDate),
  } as any
}

// Sets depth into redis.
export function setDepthIntoRedis(symbol: string, depth: SymbolDepth) {
  return getCacheClient().set<SymbolDepth>(`${depthPrefix}${symbol}`, depth)
}
