import { Logger, LogLevel } from '@abx-utils/logging'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { disableProcessing, initializeGatekeeper } from './core/gatekeeper'
import { OrderModuleConfig, UsdMidPriceEnrichedOrderMatch } from '@abx-types/order'
import { broadcastAskDepthUpdate, broadcastBidDepthUpdate } from './core/handle_broadcast_depth_updated'
import { handleOrderUpdated } from './core/handle_order_updated'
import { configureWorker } from './core'
import { settleOrderMatch } from '@abx-service-clients/order'
import { runOrderDataMigrations } from '../../migrations/migration-runner'
import { killProcessOnSignal } from '@abx-utils/internal-api-tools'

const logger = Logger.getInstance('contract_exchange', 'bootstrap')
export const noBody = {
  type: 'object',
  properties: {},
}

export async function bootstrapWorkerService() {
  killProcessOnSignal()
  Logger.configure((process.env.LOG_LEVEL as LogLevel) || LogLevel.debug)
  await runOrderDataMigrations()

  // Start the required Gatekeeper listeners
  logger.debug('Initializing Gatekeeper')
  await initializeGatekeeper().then(() => logger.debug('Gatekeeper initialized'))

  const epicurus = getEpicurusInstance()

  const configuration: OrderModuleConfig = {
    broadcastOrderUpdated: handleOrderUpdated,
    broadcastOrderMatched: async (orderMatch: UsdMidPriceEnrichedOrderMatch) => {
      await settleOrderMatch(orderMatch.id!, orderMatch.feeCurrencyToUsdMidPrice || 0, orderMatch.symbolId)
    },
    broadcastAskDepthUpdated: broadcastAskDepthUpdate,
    broadcastBidDepthUpdated: broadcastBidDepthUpdate,
  }

  logger.debug('Configuring Worker')
  await configureWorker(configuration)
  logger.debug('Worker configured')

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
