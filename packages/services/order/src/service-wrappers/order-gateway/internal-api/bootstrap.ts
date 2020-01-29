import { getEpicurusInstance, messageFactory } from '@abx-utils/db-connection-utils'
import { Logger } from '@abx-utils/logging'
import { OrderType } from '@abx-types/order'
import { marketOrderMessage, limitOrderMessage, cancelAllOrdersForAccountMessage, cancelOrderMessage, cancelAllExpiredOrdersMessage } from './schema'
import { placeOrder, OrderCancellationGateway, expireOrders } from '../core'
import { OrderGatewayEndpoints } from '@abx-service-clients/order'

const logger = Logger.getInstance('order-gateway', 'bootstrapInternalApi')

const orderCancellationGateway = new OrderCancellationGateway()

export function bootstrapInternalApi() {
  const epicurus = getEpicurusInstance()

  logger.debug('Setting up place order epicurus endpoint')
  epicurus.server(
    OrderGatewayEndpoints.placeOrder,
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
    OrderGatewayEndpoints.cancelAllOrdersForAccount,
    messageFactory(cancelAllOrdersForAccountMessage, ({ accountId }) => {
      return orderCancellationGateway.cancelOrdersOnAccount(accountId)
    }),
  )

  logger.debug('Setting up cancel order epicurus endpoint')
  epicurus.server(
    OrderGatewayEndpoints.cancelOrder,
    messageFactory(cancelOrderMessage, msg => {
      return orderCancellationGateway.cancelOrder(msg).then((order: any) => ({ orderId: order.id }))
    }),
  )

  epicurus.server(
    OrderGatewayEndpoints.cancelAllExpiredOrders,
    messageFactory(cancelAllExpiredOrdersMessage, () => {
      return expireOrders()
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
