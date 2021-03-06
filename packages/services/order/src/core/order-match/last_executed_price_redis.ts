import { isNullOrUndefined } from 'util'
import { Logger } from '@abx-utils/logging'
import { getCacheClient } from '@abx-utils/db-connection-utils'
import { findLastOrderMatchForSymbol } from '..'

const lastExecutedPrefix = 'exchange:symbol:lastExecutedPrice'

const logger = Logger.getInstance('lib', 'last-executed-price-redis')

export async function getLastExecutedPrice(symbolId: string): Promise<number> {
  const lastExecutedPrice = await getCacheClient().get<number>(`${lastExecutedPrefix}:${symbolId}`)
  logger.debug(`Retrieved last executed price for symbol: ${symbolId}`)

  if (isNullOrUndefined(lastExecutedPrice)) {
    const orderMatch = await findLastOrderMatchForSymbol(symbolId)

    if (orderMatch) {
      await setLastExecutedPrice(symbolId, orderMatch.matchPrice)
      return orderMatch.matchPrice
    }

    return 0
  }
  return lastExecutedPrice
}

export function setLastExecutedPrice(symbol: string, price: number) {
  return getCacheClient().set<number>(`${lastExecutedPrefix}:${symbol}`, price)
}
