import Decimal from 'decimal.js'
import { SourceEventType } from '@abx-types/balance'
import { findBoundaryForCurrency, feeTakenFromBase } from '@abx-service-clients/reference-data'
import { Logger } from '@abx/logging'
import { SymbolPair } from '@abx-types/reference-data'
import { Order, OrderDirection, OrderType, TradeTransaction } from '@abx-types/order'
import { retrieveInitialReserveForOrder } from './shared-utils'
import { findTradeTransactions } from '../../../../../../core'
import { releaseReserve } from '@abx-service-clients/balance'

const logger = Logger.getInstance('lib', 'releaseRemainingReserveForBuyOrder')

/**
 * When a buy market order is not fully matched the remaining reserve (allocated before the order match)
 * needs to be released. Fee amount is also considered if the fee is taken out of the quote currency.
 *
 * @param pair the currency pair
 * @param order the updated order
 * @param transaction the parent transaction to use
 */
export async function releaseRemainingReserveForBuyOrder(pair: SymbolPair, order: Order) {
  // Only the matched amount is reserved for buy market orders, so no need of any release here
  if (order.orderType === OrderType.market && order.direction === OrderDirection.buy) {
    return
  }

  const { maxDecimals: maxDecimalsForCurrency } = await findBoundaryForCurrency(pair.quote.code)

  const { rows: tradeTransactionsForOrder } = await findTradeTransactions({ where: { orderId: order.id! } })
  const initialReserve = await retrieveInitialReserveForOrder(order)
  let remainingReserve = initialReserve

  if (tradeTransactionsForOrder.length > 0) {
    const totalOrderQuoteValue = calculateTotalOrderQuoteValue(order, tradeTransactionsForOrder, pair, maxDecimalsForCurrency)
    logger.debug(`Initially reserved amount for order ${initialReserve}: ${initialReserve}`)
    logger.debug(`Total quote value traded for order ${initialReserve}: ${totalOrderQuoteValue.toString()} (including fee)`)

    remainingReserve = new Decimal(remainingReserve).minus(totalOrderQuoteValue).toNumber()
  }

  logger.debug(`Releasing ${remainingReserve} reserve for cancelled buy order ${order.id}`)

  return releaseReserve({
    currencyId: pair.quote.id,
    accountId: order.accountId,
    amount: remainingReserve,
    sourceEventId: order.id!,
    sourceEventType: SourceEventType.orderCancellation,
  })
}

function calculateTotalOrderQuoteValue(
  order: Order,
  tradeTransactionsForOrder: TradeTransaction[],
  pair: SymbolPair,
  maxDecimalsForCurrency: number,
) {
  return tradeTransactionsForOrder.reduce((acc, { id, amount, matchPrice, feeRate }) => {
    const tradeValueNoFees = new Decimal(amount).times(order.limitPrice || matchPrice)

    const fee = new Decimal(tradeValueNoFees).times(feeRate)

    const buyerReleaseAmount = feeTakenFromBase(pair)
      ? tradeValueNoFees.toDP(maxDecimalsForCurrency, Decimal.ROUND_DOWN).toNumber()
      : tradeValueNoFees
          .plus(fee)
          .toDP(maxDecimalsForCurrency, Decimal.ROUND_DOWN)
          .toNumber()

    logger.debug(`Trade value of order ${order.id} and trade transaction ${id} : ${buyerReleaseAmount}`)
    return new Decimal(acc).plus(buyerReleaseAmount)
  }, new Decimal(0))
}
