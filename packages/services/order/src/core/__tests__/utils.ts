import { wrapInTransaction, sequelize } from '@abx/db-connection-utils'
import { OrderMatch, OrderType, OrderMatchStatus, OrderStatus, OrderValidity, OrderDirection, Order } from '@abx-types/order'
import { saveOrder } from '../order'
import { createOrderMatchTransaction } from '../order-match'

export const createDumbOrder = (amount: number, price: number, accountId: string, symbol, direction: OrderDirection): Promise<Order> => {
  const order = {
    accountId,
    symbolId: symbol.id,
    direction,
    amount,
    remaining: 5,
    status: OrderStatus.submit,
    orderType: OrderType.limit,
    validity: OrderValidity.GTD,
    limitPrice: price,
  }

  return saveOrder({ order })
}

export const createDumbOrderMatchTransaction = async (amount, matchPrice, sellAccountId, sellOrderId, buyAccountId, buyOrderId, symbol) => {
  return wrapInTransaction(sequelize, null, async transaction => {
    const orderMatch: OrderMatch = {
      symbolId: symbol.id,
      amount,
      matchPrice,
      consideration: matchPrice * amount,
      sellAccountId,
      sellOrderId,
      sellOrderType: OrderType.market,
      buyAccountId,
      buyOrderId,
      buyOrderType: OrderType.limit,
      status: OrderMatchStatus.matched,
    }

    return await createOrderMatchTransaction(orderMatch, transaction)
  })
}
