import moment from 'moment'
import { Logger } from '@abx-utils/logging'
import { initialisePriceChangeStatistics, storeOrderMatchPrice } from '../core'
import { OrderMatch, DepthUpdate } from '@abx-types/order'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { OrderPubSubChannels } from '@abx-service-clients/order'
import { createQueryEndpointHandlers } from './internal_api_endponts_handler'
import express from 'express'
import { setupInternalApi } from '@abx-utils/internal-api-tools'
import { reactToBidDepthUpdate, reactToAskDepthUpdate } from './depth_update_recorders'

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

  await epicurus.subscribe(OrderPubSubChannels.bidDepthUpdated, (update: DepthUpdate) => reactToBidDepthUpdate(update))

  await epicurus.subscribe(OrderPubSubChannels.askDepthUpdated, (depthUpdate: DepthUpdate) => reactToAskDepthUpdate(depthUpdate))
}
