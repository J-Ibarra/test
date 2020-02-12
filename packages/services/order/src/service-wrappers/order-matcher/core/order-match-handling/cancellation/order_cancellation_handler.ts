import { recordCustomEvent, recordMetric } from 'newrelic'
import process from 'process'
import { Transaction } from 'sequelize'
import { Logger } from '@abx-utils/logging'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { addToQueue } from '../../gatekeeper'
import { CurrencyCode } from '@abx-types/reference-data'
import { Order, OrderDirection, OrderModuleState, OrderStatus } from '@abx-types/order'
import { removeOrderFromDepth } from '../depth'
import { findOrder, saveOrder, countTradeTransaction, publishOrderExecutionResultEvent, OrderMatchRepository } from '../../../../../core'
import { releaseRemainingReserveForCancelledOrder } from './reserve-release-handlers'
import { RuntimeError } from '@abx-types/error'

const currencyToAccountIdsCancellingOrdersFor: Record<CurrencyCode, Set<string>> = {} as any

export class OrderCancellationHandler {
  private logger = Logger.getInstance('lib', 'OrderCancellationHandler')
  private static instance: OrderCancellationHandler
  private orderMatchRepository = OrderMatchRepository.getInstance()

  /** Creates and returns a {@link OrderCancellationHandler} instance, if one already created returns that. */
  public static getInstance(): OrderCancellationHandler {
    if (!this.instance) {
      this.instance = new OrderCancellationHandler()
      OrderCancellationHandler.refreshCurrencyToAccountIdsCancellingOrdersFor()
    }

    return this.instance
  }

  public static refreshCurrencyToAccountIdsCancellingOrdersFor() {
    Object.values(CurrencyCode).forEach(currencyCode => {
      currencyToAccountIdsCancellingOrdersFor[currencyCode] = new Set()
    })
  }

  /**
   * As part of cancelling the order we need to the following
   * - order needs to be removed from the depth
   * - the order status needs to be updated to 'cancel' in persistent storage
   * - a cancellation event needs to be broadcasted
   *
   * The order cancellation is invoked by the gatekeeper while processing the order queue.
   *
   * @param state the current depth state
   * @param queuedOrder the order to cancel, retrieved from the order queue
   * @param cancellationReason the reason for cancellation
   * @param callback handles depth update on success
   */
  public async handleOrderCancellation(state: OrderModuleState, queuedOrder: Order, cancellationReason: string): Promise<any> {
    recordMetric('metric_start_order_cancellation', 1)
    const currencyToReleaseFundsFrom = this.getCurrencyToReleaseReservedBalanceFrom(queuedOrder)
    const { orderRemoved, topOfDepthUpdated } = await removeOrderFromDepth(queuedOrder, state.depth)

    if (orderRemoved) {
      this.logger.debug(`Cancelled order ${queuedOrder.id} removed from depth`)
      state.depth.broadcast.depthUpdated(queuedOrder.symbolId, queuedOrder.direction, state.depth.orders[queuedOrder.symbolId], topOfDepthUpdated)
    }

    try {
      if (!this.currentlyCancellingOrderForAccount(queuedOrder)) {
        currencyToAccountIdsCancellingOrdersFor[currencyToReleaseFundsFrom].add(queuedOrder.accountId)
        const updatedOrder = await this.cancelOrderAndBroadcast(state, queuedOrder, cancellationReason)
        currencyToAccountIdsCancellingOrdersFor[currencyToReleaseFundsFrom].delete(queuedOrder.accountId)

        return updatedOrder
      } else {
        this.requeueOrderCancellation(queuedOrder, cancellationReason)
      }

      return queuedOrder
    } catch (err) {
      recordMetric('metric_error_order_cancellation', 1)
      currencyToAccountIdsCancellingOrdersFor[currencyToReleaseFundsFrom].delete(queuedOrder.accountId)

      this.logger.error(`Error ocurred trying to cancel order ${queuedOrder.id}`)
      return queuedOrder
    }
  }

  public async cancelOrderAndBroadcast(state: OrderModuleState, queuedOrder: Order, cancellationReason: string, t?: Transaction): Promise<Order> {
    const order = await findOrder(queuedOrder.id!, t)

    if (!order) {
      throw new RuntimeError(`Unable to find order ${queuedOrder.id}`)
    }

    await this.verifyOrderNotFilledOrAlreadyCancelled(order)

    const allOrderMatchesSettled = await this.tradeTransactionsExistForAllMatchesForOrder(order, t)
    if (!allOrderMatchesSettled) {
      this.logger.debug(`Order matches are not settled - adding back to cancellation queue`)
      await this.addOrderCancellationRequestBackToQueue(order, cancellationReason)

      return order
    }
    this.logger.debug(`All order matches are settled`)

    const cancelledOrder = await this.cancelOrder(order, cancellationReason, t)

    recordCustomEvent('event_order_cancelled', {
      direction: cancelledOrder.direction,
      symbol: cancelledOrder.symbolId,
      orderType: cancelledOrder.orderType,
      amount: cancelledOrder.amount,
    })

    state.handler!.broadcast!.orderUpdated(cancelledOrder)
    return cancelledOrder
  }

  private verifyOrderNotFilledOrAlreadyCancelled(order: Order) {
    if (order.status === OrderStatus.fill) {
      recordMetric('metric_cant_cancel_filled_order', 1)

      this.logger.warn(`Order ${order.id} has been filled and cannot be cancelled`)
      return Promise.reject('Order has been Filled')
    } else if (order.status === OrderStatus.cancel) {
      recordMetric('metric_cant_cancel_cancelled_order', 1)

      this.logger.warn(`Order ${order.id} has already been cancelled`)
      return Promise.reject('Order has been cancelled')
    }

    return Promise.resolve()
  }

  private currentlyCancellingOrderForAccount(order: Order) {
    const currencyToReleaseReservedBalanceFrom = this.getCurrencyToReleaseReservedBalanceFrom(order)

    return currencyToAccountIdsCancellingOrdersFor[currencyToReleaseReservedBalanceFrom].has(order.accountId)
  }

  private getCurrencyToReleaseReservedBalanceFrom(order: Order): CurrencyCode {
    const [base, quote] = order.symbolId.split('_')

    return order.direction === OrderDirection.buy ? (quote as CurrencyCode) : (base as CurrencyCode)
  }

  /**
   * The order cancellation reserve release logic runs independently from the settlement release logic (running in the settlement service).
   * Therefore we want to make sure that all order matches have settled before performing the reserve release logic, to prevent
   */
  private async tradeTransactionsExistForAllMatchesForOrder(order: Order, transaction?: Transaction) {
    const [orderMatchesCount, tradeTransactionsCount] = await Promise.all([
      this.orderMatchRepository.getOrderMatchCountForOrder(
        order.direction === OrderDirection.buy ? { buyOrderId: order.id! } : { sellOrderId: order.id! },
        transaction,
      ),
      countTradeTransaction({ orderId: order.id! }, transaction),
    ])

    return orderMatchesCount === tradeTransactionsCount
  }

  private async cancelOrder(order: Order, cancellationReason: string, t?: Transaction): Promise<Order> {
    return wrapInTransaction(
      sequelize,
      t,
      async transaction => {
        this.logger.debug(`Releasing reserves for cancelled order - id: ${order.id} - reason: ${cancellationReason}`)
        await releaseRemainingReserveForCancelledOrder(order)

        const updatedOrder = await saveOrder({
          order: { ...order, status: OrderStatus.cancel },
          cancellationReason,
          transaction,
        })

        this.logger.debug(`Status changed to cancel for order ${updatedOrder.id}`)
        this.logger.debug(`Successfully cancelled order ${updatedOrder.id}`)
        recordMetric('metric_complete_order_cancellation', 1)
        process.nextTick(() => publishOrderExecutionResultEvent(order.id!))

        return updatedOrder
      },
      () => this.requeueOrderCancellation(order, cancellationReason),
    )
  }

  private addOrderCancellationRequestBackToQueue(order: Order, cancellationReason: string) {
    this.logger.info(`Attempted to cancel order ${order.id} where not all order matches have settled yet.`)

    recordCustomEvent('event_order_cancelled_not_all_matches_settled', {
      orderId: order.id,
    })

    return this.requeueOrderCancellation(order, cancellationReason)
  }

  private requeueOrderCancellation(order: Order, cancellationReason: string) {
    setTimeout(() => {
      const currencyToReleaseFundsFrom = this.getCurrencyToReleaseReservedBalanceFrom(order)
      currencyToAccountIdsCancellingOrdersFor[currencyToReleaseFundsFrom].delete(order.accountId)
      this.logger.debug(`Requeuing order cancellation for order ${order.id}`)

      addToQueue(order.symbolId, {
        requestType: 'cancel',
        cancellationReason,
        order,
      })
    }, 1_000)
  }
}
