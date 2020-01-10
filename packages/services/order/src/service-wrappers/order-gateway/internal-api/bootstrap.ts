import { getEpicurusInstance, messageFactory } from '@abx/db-connection-utils'
import { Logger } from '@abx/logging'
import { OrderEndpoints } from '@abx-service-clients/order'
import { OrderType } from '@abx-types/order'
import { marketOrderMessage, limitOrderMessage } from './schema'
import { placeOrder } from '../core'

const logger = Logger.getInstance('order-gateway', 'bootstrapInternalApi')

export function bootstrapInternalApi() {
  const epicurus = getEpicurusInstance()

  logger.debug('Setting up place order epicurus endpoint')
  epicurus.server(
    OrderEndpoints.placeOrder,
    messageFactory(
      msg => (msg.orderType === OrderType.market ? marketOrderMessage : limitOrderMessage),
      request => {
        logger.debug(
          `Received a ${request.direction} ${request.orderType} order request issued by account ${request.accountId} for pair ${request.symbolId}`,
        )

        return placeOrder(request)
      },
    ),
  )

  logger.debug('Setting up place order epicurus endpoint')
  epicurus.server(
    OrderEndpoints.placeOrder,
    messageFactory(
      msg => (msg.orderType === OrderType.market ? marketOrderMessage : limitOrderMessage),
      request => {
        logger.debug(
          `Received a ${request.direction} ${request.orderType} order request issued by account ${request.accountId} for pair ${request.symbolId}`,
        )

        return placeOrder(request)
      },
    ),
  )

  epicurus.server(
    OrderEndpoints.cancelAllOrdersForAccount,
    messageFactory(cancelAllOrdersForAccountMessage, msg => {
      return handler.cancelAllOrdersForAccount(msg)
    }),
  )

  logger.debug('Setting up cancel order epicurus endpoint')
  epicurus.server(
    EpicurusRequestChannel.cancelOrder,
    messageFactory(cancelOrderMessage, msg => {
      return handler.cancelOrder(msg).then((order: any) => ({ orderId: order.id }))
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
    epicurus.shutdown()
    logger.debug('Graceful shutdown complete')
  }
}
