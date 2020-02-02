import { Logger } from '@abx-utils/logging'
import { placeOrder, OrderCancellationGateway, expireOrders } from '../core'
import { OrderGatewayEndpoints } from '@abx-service-clients/order'
import express from 'express'
import { setupInternalApi } from '@abx-utils/internal-api-tools'

const logger = Logger.getInstance('order-gateway', 'bootstrapInternalApi')

const orderCancellationGateway = new OrderCancellationGateway()

export function bootstrapInternalApi(app: express.Express) {
  logger.debug('Setting up place order epicurus endpoint')
  const routes = createRoutes()
  setupInternalApi(app, routes)

  // Clean shutdown Process
  process.on('SIGINT', () => {
    logger.warn('Contract exchange received SIGINT')
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    logger.warn('Contract exchange received SIGTERM')
    process.exit(0)
  })

  process.on('exit', code => {
    if (process.env.NODE_ENV !== 'test') {
      logger.warn(`Calling EXIT with code ${code}`)
    }
  })
}

function createRoutes() {
  return [
    {
      path: OrderGatewayEndpoints.placeOrder,
      handler: request => {
        logger.debug(
          `Received a ${request.direction} ${request.orderType} order request issued by account ${request.accountId} for pair ${request.symbolId}`,
        )

        return placeOrder(request)
      },
    },
    {
      path: OrderGatewayEndpoints.cancelAllOrdersForAccount,
      handler: ({ accountId }) => {
        return orderCancellationGateway.cancelOrdersOnAccount(accountId)
      },
    },
    {
      path: OrderGatewayEndpoints.cancelOrder,
      handler: msg => {
        return orderCancellationGateway.cancelOrder(msg).then((order: any) => ({ orderId: order.id }))
      },
    },
    {
      path: OrderGatewayEndpoints.cancelAllExpiredOrders,
      handler: () => expireOrders(),
    },
  ]
}
