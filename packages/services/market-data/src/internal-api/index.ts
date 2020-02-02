import moment from 'moment'
import { Logger } from '@abx/logging'
import { initialisePriceChangeStatistics, CacheFirstMidPriceRepository, storeAskPrice, storeBidPrice, storeOrderMatchPrice } from '../core'
import { OrderDirection, OrderMatch } from '@abx-types/order'
import { DepthItem } from '@abx-types/depth-cache'
import { getEpicurusInstance } from '@abx/db-connection-utils'
import { OrderPubSubChannels } from '@abx-service-clients/order'
import { createQueryEndpointHandlers } from './internal_api_endponts_handler'
import express from 'express'
import { setupInternalApi } from '@abx-utils/internal-api-tools'

interface DepthUpdated {
  topOfDepthUpdated: boolean
  symbolId: string
  aggregateDepth: DepthItem[]
  oppositeDepthTopOrder: DepthItem
}

const logger = Logger.getInstance('market_data_reconciliation', 'bootstrap')

export async function bootstrapInternalApi(app: express.Express) {
  await initialisePriceChangeStatistics()
  setupInternalApi(app, createQueryEndpointHandlers())

  const epicurus = getEpicurusInstance()

  await epicurus.subscribe(OrderPubSubChannels.orderMatchSettled, (orderMatch: OrderMatch) => {
    if (orderMatch) {
      logger.debug(`Order match settled. Recording new statistics for symbol ${orderMatch.symbolId}`)
      storeOrderMatchPrice(
        orderMatch,
        moment()
          .subtract(24, 'hours')
          .toDate(),
      )
    }
  })

  await epicurus.subscribe(
    OrderPubSubChannels.bidDepthUpdated,
    ({ topOfDepthUpdated, symbolId, aggregateDepth = [{ amount: 0, price: 0 }], oppositeDepthTopOrder: topOfAskDepth }: DepthUpdated) => {
      // When the last order has been removed from the order book both sell and buy depth will be empty
      // we don't want to record a mid-price of 0 in this scenario
      if (topOfDepthUpdated && (aggregateDepth.length > 0 || !!topOfAskDepth)) {
        logger.debug(`Top of depth changed for symbol ${symbolId} and ${OrderDirection.buy} depth`)
        CacheFirstMidPriceRepository.getInstance().recordDepthMidPriceChange(symbolId, aggregateDepth[0], topOfAskDepth)
        if (aggregateDepth.length > 0) {
          storeBidPrice(aggregateDepth[0].price, symbolId)
        }
      }
    },
  )

  await epicurus.subscribe(
    OrderPubSubChannels.askDepthUpdated,
    ({ topOfDepthUpdated, symbolId, aggregateDepth = [{ amount: 0, price: 0 }], oppositeDepthTopOrder: topOfBidDepth }: DepthUpdated) => {
      // When the last order has been removed from the order book both sell and buy depth will be empty
      // we don't want to record a mid-price of 0 in this scenario
      if (topOfDepthUpdated && (aggregateDepth.length > 0 || !!topOfBidDepth)) {
        logger.debug(`Top of depth changed for symbol ${symbolId} and ${OrderDirection.sell} depth`)
        CacheFirstMidPriceRepository.getInstance().recordDepthMidPriceChange(symbolId, topOfBidDepth, aggregateDepth[0])
        if (aggregateDepth.length > 0) {
          storeAskPrice(aggregateDepth[0].price, symbolId)
        }
      }
    },
  )
}
