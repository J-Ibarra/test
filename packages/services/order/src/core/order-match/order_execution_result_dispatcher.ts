import Decimal from 'decimal.js'
import { Transaction } from 'sequelize'
import { Environment, SymbolPair, SymbolPairStateFilter } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'
import { sequelize, wrapInTransaction, getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { findOrder } from '../order'
import { Order, OrderDirection, OrderMatchStatus, OrderStatus } from '@abx-types/order'
import { getCompleteSymbolDetails } from '@abx-service-clients/reference-data'
import { findTradeTransactions, findOrderMatchTransactions } from '../transaction'
import { retrieveTotalOrderValueReceivedByAccount } from '@abx-service-clients/balance'
import { RuntimeError } from '@abx-types/error'
import { OrderPubSubChannels } from '@abx-service-clients/order'

export interface TradeExecutionResult {
  accountId: string
  orderId: number
  amountReceived: number
  amountFilled: number
}

const logger = Logger.getInstance('order_execution_result_dispatcher', 'publishOrderExecutionResultEvent')
const symbolDictionary: Record<string, SymbolPair> = {}

/**
 * Publishes order execution result for a given order, retrieving all the balance adjustments that happened as a result of
 * any order matches that happened for the order. The total value(sum) of the balance adjustments for the currency received (quote for sell orders and base for buy order)
 * is then sent in the `amountReceived` field of the {@link TradeExecutionResult} event.
 *
 * @param orderId the order Id to calculate the execution result for
 * @param transaction the parent Db transaction to use if present
 */
export function publishOrderExecutionResultEvent(orderId: number, parentTransaction?: Transaction) {
  if (process.env.NODE_ENV === Environment.test) {
    return
  }

  return wrapInTransaction(sequelize, parentTransaction, async (transaction) => {
    logger.info(`Publishing order execution result for ${orderId}`)

    const { order, allMatchesSettled } = await allMatchesSettledForOrder(orderId, transaction)

    if (allMatchesSettled) {
      logger.info(`All matches settled for order ${orderId}`)
      const { rows: orderTradeTransactions } = await findTradeTransactions({ where: { orderId }, transaction })

      const tradedSymbol = symbolDictionary[order.symbolId] || (await getCompleteSymbolDetails(order.symbolId, SymbolPairStateFilter.all))
      symbolDictionary[order.symbolId] = tradedSymbol

      const currencyReceived = order.direction === OrderDirection.buy ? tradedSymbol.base : tradedSymbol.quote

      logger.info(`Counter trade ids ${orderTradeTransactions.map(({ counterTradeTransactionId }) => counterTradeTransactionId)}`)
      const totalAmountReceived = await retrieveTotalOrderValueReceivedByAccount(
        order.accountId,
        currencyReceived.id,
        orderTradeTransactions.map(({ counterTradeTransactionId }) => counterTradeTransactionId),
      )
      logger.info(`Amount Received ${totalAmountReceived} for order ${orderId}`)

      const epicurus = getEpicurusInstance()
      epicurus.publish(OrderPubSubChannels.orderExecutionResultDispatched, {
        accountId: order.accountId,
        orderId: order.id,
        amountReceived: totalAmountReceived,
        amountFilled: new Decimal(order.amount).minus(order.remaining).toNumber(),
      } as TradeExecutionResult)
    }
  })
}

async function allMatchesSettledForOrder(orderId: number, transaction: Transaction): Promise<{ order: Order; allMatchesSettled: boolean }> {
  const order = await findOrder(orderId, transaction)

  if (!order) {
    throw new RuntimeError(`Unable to find order ${orderId}`)
  }

  if (order.status === OrderStatus.fill || order.status === OrderStatus.cancel) {
    const orderMatches = await findOrderMatchTransactions(
      { where: order.direction === OrderDirection.buy ? { buyOrderId: orderId } : { sellOrderId: orderId } },
      transaction,
    )
    logger.info(`${orderMatches.length} order matches found for order ${orderId}`)

    return {
      order,
      allMatchesSettled: !orderMatches.find(({ status }) => status === OrderMatchStatus.matched),
    }
  }

  return {
    order,
    allMatchesSettled: false,
  }
}
