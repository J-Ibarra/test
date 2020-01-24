import { get, head } from 'lodash'
import { Logger } from '../../../../config/logging'
import { AggregateDepth } from '../../../../orders/interface'

const logger = Logger.getInstance('lib', 'calculateMidPrice')

/**
 * Calculates the snapshot mid-price for a given symbol.
 * Formula used is:  (top of buy price + top of sell price) / 2
 *
 * @param aggregateDepth the depth at a specific point in time
 */
export function calculateMidPrice({ buy, sell, symbolId }: AggregateDepth): number {
  const topOfTheBid = get(head(buy), 'price', 0)
  const topOfTheAsk = get(head(sell), 'price', 0)

  let newMidPrice
  if (!topOfTheBid && topOfTheAsk) {
    newMidPrice = topOfTheAsk
  } else if (!topOfTheAsk && topOfTheBid) {
    newMidPrice = topOfTheBid
  } else {
    newMidPrice = (topOfTheBid + topOfTheAsk) / 2
  }

  logger.debug(`Calculated new mid-price for ${symbolId}: ${newMidPrice}`)
  return newMidPrice
}
