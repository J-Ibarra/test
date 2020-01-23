import { noticeError } from 'newrelic'
import { Transaction } from 'sequelize'
import { Logger } from '@abx-utils/logging'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { ValidationError } from '@abx-types/error'
import { AccountOrderCancellationRequest, CancelOrderRequest, Order, OrderStatus } from '@abx-types/order'
import { findOrder, findOrders, saveOrder } from '../../../core'
import { addToQueue } from './add_to_queue'

/** Defines the gateway used for placing order cancellations. */
export class OrderCancellationGateway {
  private logger = Logger.getInstance('lib', 'OrderCancellationGateway')

  private static instance: OrderCancellationGateway

  /** Creates and returns a {@link OrderCancellationGateway} instance, if one already created returns that. */
  public static getInstance(): OrderCancellationGateway {
    if (!this.instance) {
      this.instance = new OrderCancellationGateway()
    }

    return this.instance
  }

  /**
   * Attempts to add `cancel` request to the order queue, triggered by the API.
   * The order status is updated to `pendingCancel`.
   *
   * @param request contains the id of the order to cancel
   */
  public async cancelOrder({ orderId, cancellationReason }: CancelOrderRequest): Promise<Order> {
    const cancelledOrder = await wrapInTransaction(sequelize, null, async transaction => {
      const order = await findOrder(orderId, transaction)

      return this.persistOrderCancellation(orderId, order!, transaction)
    })

    await this.addCancelledOrderToQueue(cancelledOrder, cancellationReason || 'User requested cancellation')

    return cancelledOrder
  }

  private async persistOrderCancellation(orderId: number, order: Order, transaction?: Transaction) {
    this.validateOrder(order, orderId)

    return await saveOrder({ order: { ...order, status: OrderStatus.pendingCancel }, transaction })
  }

  private validateOrder(order: Order, orderId: number) {
    if (!order) {
      this.logger.warn(`Failed to cancel non-existent order ${orderId}`)
      const err = new ValidationError(`Failed to cancel non-existent order ${orderId}`)
      noticeError(err)
      throw err
    }

    if (order.status === OrderStatus.pendingCancel || order.status === OrderStatus.cancel || order.status === OrderStatus.fill) {
      this.logger.warn(`Order ${order.id} is in the wrong state for cancellation ${order.status}`)
      const err = new ValidationError(`Order ${order.id} is in the wrong state for cancellation ${order.status}`)
      noticeError(err)
      throw err
    }
  }

  private addCancelledOrderToQueue(order: Order, cancellationReason: string) {
    return addToQueue({
      requestType: 'cancel',
      order: { ...order, status: OrderStatus.pendingCancel },
      cancellationReason,
    })
  }

  /**
   * Cancels all the open/partially-filled orders for an account.
   * Used when an account is being suspended.
   */
  public async cancelOrdersOnAccount({ accountId }: AccountOrderCancellationRequest): Promise<void> {
    const cancelledOrders = await wrapInTransaction(sequelize, null, async () => {
      const orders = await findOrders({ where: { accountId, status: 'submit' } })

      return Promise.all(orders.map(order => this.persistOrderCancellation(order.id!, order)))
    })
    this.logger.info(`cancelledOrders:${cancelledOrders.length}`)
    if (cancelledOrders.length > 0) {
      await Promise.all(cancelledOrders.map(cancelledOrder => this.addCancelledOrderToQueue(cancelledOrder, 'Account Suspended')))
    }
  }
}
