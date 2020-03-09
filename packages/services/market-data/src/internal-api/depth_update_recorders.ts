import { CacheFirstMidPriceRepository, storeAskPrice, storeBidPrice } from '../core'
import { OrderDirection, DepthUpdate } from '@abx-types/order'
import { Logger } from '@abx-utils/logging'

const logger = Logger.getInstance('market-data', 'depth_update_recorders')

export function reactToBidDepthUpdate({
  topOfDepthUpdated,
  symbolId,
  aggregateDepth = [{ amount: 0, price: 0 }],
  oppositeDepthTopOrder: topOfAskDepth,
}: DepthUpdate) {
  // When the last order has been removed from the order book both sell and buy depth will be empty
  // we don't want to record a mid-price of 0 in this scenario
  if (topOfDepthUpdated && (aggregateDepth.length > 0 || !!topOfAskDepth)) {
    logger.debug(`Top of depth changed for symbol ${symbolId} and ${OrderDirection.buy} depth`)
    CacheFirstMidPriceRepository.getInstance().recordDepthMidPriceChange(symbolId, aggregateDepth[0], topOfAskDepth)
  }

  if (topOfDepthUpdated && aggregateDepth.length > 0) {
    storeBidPrice(aggregateDepth[0].price, symbolId)
  } else if (aggregateDepth.length === 0) {
    storeBidPrice(0, symbolId)
  }
}

export function reactToAskDepthUpdate({
  topOfDepthUpdated,
  symbolId,
  aggregateDepth = [{ amount: 0, price: 0 }],
  oppositeDepthTopOrder: topOfBidDepth,
}: DepthUpdate) {
  // When the last order has been removed from the order book both sell and buy depth will be empty
  // we don't want to record a mid-price of 0 in this scenario
  if (topOfDepthUpdated && (aggregateDepth.length > 0 || !!topOfBidDepth)) {
    logger.debug(`Top of depth changed for symbol ${symbolId} and ${OrderDirection.sell} depth`)
    CacheFirstMidPriceRepository.getInstance().recordDepthMidPriceChange(symbolId, topOfBidDepth, aggregateDepth[0])
  }

  if (topOfDepthUpdated && aggregateDepth.length > 0) {
    storeAskPrice(aggregateDepth[0].price, symbolId)
  } else if (aggregateDepth.length === 0) {
    storeAskPrice(0, symbolId)
  }
}
