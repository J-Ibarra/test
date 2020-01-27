import { Transaction } from 'sequelize'
import { Logger } from '@abx-utils/logging'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { FatalError } from '@abx-types/error'
import { Order, OrderModuleState, OrderStatus, OrderType } from '@abx-types/order'
import { addOrderToDepth } from '../../depth'
import { OrderCancellationHandler } from '../../cancellation'
import { matchOrder } from './matcher'
import { broadcastUpdates } from './update_event_dispatcher'
import { validateOrderExpiry } from './validator'
import { getDepthFromCache } from '../../depth/redis'
const orderCancellationHandler = OrderCancellationHandler.getInstance()
const logger = Logger.getInstance('lib', 'order_match_orchestrator')

export async function matchOrderAgainstDepth(order: Order, state: OrderModuleState) {
  return wrapInTransaction(
    sequelize,
    null,
    async transaction => {
      try {
        return orchestrateOrderMatch(order, state, transaction)
      } catch (e) {
        throw new FatalError('Critical Place Order Error: ', {
          context: {
            order,
            currentDepth: state.depth.orders[order.symbolId],
            originalDepth: await getDepthFromCache(order.symbolId).catch(redisErr => redisErr),
            err: e,
          },
        })
      }
    },
    undefined,
    sequelize.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    sequelize.Sequelize.Deferrable.SET_DEFERRED,
  )
}

async function orchestrateOrderMatch(order: Order, state: OrderModuleState, transaction: Transaction) {
  try {
    validateOrderExpiry(order)
    logger.debug(`Order Expiry ${order.id} validated`)
  } catch (e) {
    await orderCancellationHandler.cancelOrderAndBroadcast(state, order, e.message)
    throw e
  }

  const { order: orderAfterMatch, orderUpdates, orderMatches } = await matchOrder(order, state, transaction)
  logger.debug(`Order ${order.id} matched`)
  orderMatches.forEach(orderMatch =>
    logger.info(`Matched buy order ${orderMatch.buyOrderId} with sell order ${orderMatch.sellOrderId} and amount ${orderMatch.amount}`),
  )

  if (orderAfterMatch.remaining > 0 && orderAfterMatch.status !== OrderStatus.cancel && orderAfterMatch.orderType === OrderType.limit) {
    logger.debug(`Adding remaining ${orderAfterMatch.remaining} for order ${order.id} to depth.`)
    addOrderToDepth(orderAfterMatch, state.depth)
  }

  broadcastUpdates(orderUpdates, orderMatches, state.handler!)

  return orderAfterMatch
}
