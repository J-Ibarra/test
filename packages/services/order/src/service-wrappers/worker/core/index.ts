import { EpicurusRequestChannel } from '../../packages/commons/index'
import { Logger } from '../../packages/config/logging'
import { getInstance } from '../../packages/db/epicurus'
import { disableProcessing, initializeGatekeeper } from '../../packages/gatekeeper'
import * as orders from '../../packages/orders'
import { OrderModuleConfig } from '../../packages/orders/interface'
import { messageFactory } from '../message_schema'
import { broadcastAskDepthUpdate, broadcastBidDepthUpdate } from './lib/handle_broadcast_depth_updated'
import { handleOrderMatched } from './lib/handle_order_matched'
import { handleOrderUpdated } from './lib/handle_order_updated'
import { noBody } from './message_schemas'

const logger = Logger.getInstance('contract_exchange', 'bootstrap')

export async function bootstrap() {
  // Start the required Gatekeeper listeners
  logger.debug('Initializing Gatekeeper')
  await initializeGatekeeper().then(() => logger.debug('Gatekeeper initialized'))

  const epicurus = getInstance()

  const configuration: OrderModuleConfig = {
    broadcastOrderUpdated: handleOrderUpdated,
    broadcastOrderMatched: handleOrderMatched,
    broadcastAskDepthUpdated: broadcastAskDepthUpdate,
    broadcastBidDepthUpdated: broadcastBidDepthUpdate,
  }

  logger.debug('Configuring Worker')
  await orders.configureWorker(configuration)
  logger.debug('Worker configured')

  logger.debug('Setting up stopContractExchange epicurus endpoint')
  epicurus.server(
    EpicurusRequestChannel.stopContractExchange,
    messageFactory(noBody, () => {
      return orders.stopContractExchange().then(() => ({}))
    }),
  )

  logger.debug('Setting up resumeContractExchange epicurus endpoint')
  epicurus.server(
    EpicurusRequestChannel.resumeContractExchange,
    messageFactory(noBody, () => {
      return orders.resumeContractExchange().then(() => ({}))
    }),
  )

  logger.debug('Setting up resumeContractExchange epicurus endpoint')
  epicurus.server(
    EpicurusRequestChannel.getContractExchangeStatus,
    messageFactory(noBody, () => {
      return orders.getContractExchangeStatus().then(status => ({ status }))
    }),
  )

  // Clean shutdown Process
  process.on('SIGINT', () => {
    logger.warn('Contract exchange received SIGINT')
    gracefulShutdown().then(() => process.exit(0))
  })

  process.on('SIGTERM', () => {
    logger.warn('Contract exchange received SIGTERM')
    gracefulShutdown().then(() => process.exit(0))
  })

  process.on('exit', code => {
    if (process.env.NODE_ENV !== 'test') {
      logger.warn(`Calling EXIT with code ${code}`)
    }
  })

  async function gracefulShutdown() {
    await disableProcessing()
    epicurus.shutdown()
    logger.debug('Graceful shutdown complete')
  }
}
