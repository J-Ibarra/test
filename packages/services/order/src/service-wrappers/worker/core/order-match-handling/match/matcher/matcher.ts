import { Transaction } from 'sequelize'
import { Logger } from '@abx/logging'
import { Order, OrderDirection, OrderModuleState, OrderStatus, OrderType, UsdMidPriceEnrichedOrderMatch } from '@abx-types/order'
import { getTopOrder, removeOrderFromDepth } from '../../depth'
import { OrderCancellationHandler } from '../../cancellation'
import { fillOrders } from './order_filler'

const orderCancellationHandler = OrderCancellationHandler.getInstance()

export interface OrderWithCancellationDetails extends Order {
  /** Set to true when, after a match, the remaining currency amount is not sufficient. */
  shouldCancel?: boolean
  cancellationReason?: string
}

export interface OrderMatchResult {
  order: OrderWithCancellationDetails
  orderMatches: UsdMidPriceEnrichedOrderMatch[]
  orderUpdates: Order[]
}

const logger = Logger.getInstance('lib', 'matchOrder')

/**
 * Cycles through the order depth attempting to find a match(of opposite order direction) for a given order.
 * The matcher might need to got n levels deep in the order book(depth) before an order is fully matched.
 *
 * @param order the order to attempt to match against the order book
 * @param state contains the depth
 * @param transaction the parent transaction to use
 * @param orderMatches the order matches that have happened thoughout the matching process
 * @param orderUpdates all order updates
 */
export async function matchOrder(
  order: Order,
  state: OrderModuleState,
  transaction: Transaction,
  orderMatches = [] as UsdMidPriceEnrichedOrderMatch[],
  orderUpdates = [] as Order[],
): Promise<OrderMatchResult> {
  if (order.remaining === 0 || order.status === OrderStatus.cancel) {
    return {
      order,
      orderMatches,
      orderUpdates,
    }
  }

  const matchingDirection = OrderDirection.buy === order.direction ? OrderDirection.sell : OrderDirection.buy
  const matchCandidate = getTopOrder(order.symbolId, state.depth, matchingDirection, order.accountId)

  if (!!matchCandidate) {
    logger.debug(`Found potential match for order ${order.id}, match - ${matchCandidate.id}`)
    return handleDepth(order, matchCandidate, state, orderMatches, orderUpdates, transaction)
  } else {
    await handleNoDepth(order, state, transaction)

    return {
      order,
      orderMatches,
      orderUpdates,
    }
  }
}

async function handleDepth(
  order: Order,
  matchCandidate: Order,
  state: OrderModuleState,
  orderMatches = [] as UsdMidPriceEnrichedOrderMatch[],
  orderUpdates = [] as Order[],
  transaction: Transaction,
): Promise<OrderMatchResult> {
  const { ordersFilled, order: updatedOrder, updatedMatchingOrder, orderMatches: updateMatches, orderUpdates: updates } = await fillOrders(
    order,
    matchCandidate,
    state.depth,
    orderMatches,
    orderUpdates,
    transaction,
  )

  const continueThroughDepth: boolean = (ordersFilled && !updatedOrder.shouldCancel) || (!ordersFilled && !!updatedMatchingOrder!.shouldCancel)

  await Promise.all([cancelOrderBeingProcessed(updatedOrder, state, transaction), cancelMatchingOrder(updatedMatchingOrder!, state, transaction)])

  return continueThroughDepth
    ? matchOrder(updatedOrder, state, transaction, updateMatches, updates)
    : {
        order,
        orderMatches,
        orderUpdates,
      }
}

async function handleNoDepth(order: Order, state: OrderModuleState, transaction: Transaction): Promise<void> {
  if (order.orderType === OrderType.market) {
    await orderCancellationHandler.cancelOrderAndBroadcast(state, order, 'No depth to match against', transaction)
  }
}

function cancelOrderBeingProcessed(order: OrderWithCancellationDetails, state: OrderModuleState, transaction: Transaction): any {
  if (order.shouldCancel) {
    logger.warn(`Cancelling order: ${order.id}`)
    return orderCancellationHandler.cancelOrderAndBroadcast(state, order, order.cancellationReason!, transaction)
  }
}

function cancelMatchingOrder(matchCandidateToCancel: OrderWithCancellationDetails, state: OrderModuleState, transaction: Transaction): any {
  if (matchCandidateToCancel && matchCandidateToCancel.shouldCancel) {
    removeOrderFromDepth(matchCandidateToCancel, state.depth)
    logger.warn(`Cancelling matching order: ${matchCandidateToCancel.id}`)
    return orderCancellationHandler.cancelOrderAndBroadcast(state, matchCandidateToCancel, matchCandidateToCancel.cancellationReason!, transaction)
  }
}
