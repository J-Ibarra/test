import { Logger } from '@abx-utils/logging'
import { Order, OrderStatus, PlaceOrderRequest } from '@abx-types/order'
import { OrderPubSubChannels } from '@abx-service-clients/order'
import { addToQueue } from './add_to_queue'
import { validatePriceIfAccountBoundByOrderRange } from './last-executed-price-checks/order_validations'
import { prepareOrder } from './prepare_order'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'

const logger = Logger.getInstance('contract_exchange', 'placeOrder')

export async function placeOrder(request: PlaceOrderRequest): Promise<Order> {
  try {
    if (request.accountId !== process.env.MARKET_MAKER_ACCOUNT_ID) {
      await validatePriceIfAccountBoundByOrderRange(request)
    }

    const order: Order = {
      ...request,
      id: undefined,
      remaining: request.amount,
      status: OrderStatus.submit,
      createdAt: undefined,
      updatedAt: undefined,
    }

    const savedOrder = await prepareOrder(order)

    logger.debug(`Adding order to order queue ${savedOrder.id}`)
    await addToQueue({
      requestType: 'place',
      order: savedOrder,
    })

    const epicurus = getEpicurusInstance()

    logger.debug(`Publishing order placed on queue event for ${savedOrder.id}`)
    epicurus.publish(OrderPubSubChannels.orderPlacedOnQueue, savedOrder)

    return savedOrder
  } catch (e) {
    logger.error(
      `Error while placing ${request.orderType} ${request.amount} ${request.direction} order for account ${request.accountId} and symbol ${request.symbolId}`,
    )
    logger.error(e)
    throw e
  }
}
