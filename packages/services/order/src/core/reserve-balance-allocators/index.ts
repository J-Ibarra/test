import { Transaction } from 'sequelize'
import { SymbolPair } from '@abx-types/reference-data'
import { Order, OrderDirection, OrderType } from '@abx-types/order'
import { allocateBuyOrderReserveBalance } from './buy_order_balance_allocator'
import { allocateSellOrderReserveBalance } from './sell_order_balance_allocator'

/**
 * Moves funds from the available balance to reserve balance, making sure enough funds will be reserved
 * to cover the order value + execution fees. The reserve balance is then updated on order settlement.
 *
 * @param order the order placed
 * @param pair the traded currency pair
 * @param reserve the amount to reserve
 * @param orderId the order id to associate the reserve with
 * @param transaction the parent DB transaction
 */
export function allocateReserveBalance(order: Order, pair: SymbolPair, transaction: Transaction): Promise<void> {
  if (order.direction === OrderDirection.sell) {
    return allocateSellOrderReserveBalance(order, pair, transaction)
  } else if (order.direction === OrderDirection.buy && order.orderType !== OrderType.market) {
    return allocateBuyOrderReserveBalance({ order, pair })
  }

  return Promise.resolve()
}

export * from './buy_order_balance_allocator'
export * from './sell_order_balance_allocator'
export * from './initial_balance_retriever'
