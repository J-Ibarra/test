import Decimal from 'decimal.js'
import { SourceEventType } from '@abx-types/balance'
import { findBoundaryForCurrency, feeTakenFromBase } from '@abx-service-clients/reference-data'
import { Logger } from '@abx/logging'
import { TradeTransaction, Order } from '@abx-types/order'
import { SymbolPair } from '@abx-types/reference-data'
import { releaseReserve } from '@abx-service-clients/balance'
import { findTradeTransactions, retrieveInitialReserveForOrder } from '../../../../../../core'

const logger = Logger.getInstance('lib', 'releaseRemainingReserveForSellOrder')

/**
 * When a sell market order is not fully matched the remaining reserve (allocated before the order match)
 * needs to be released. Fee amount is also considered if the fee is taken out of the base currency.
 *
 * @param pair the currency pair
 * @param order the updated order
 * @param transaction the parent transaction to use
 */
export async function releaseRemainingReserveForSellOrder(pair: SymbolPair, order: Order) {
  const releaseAmount = feeTakenFromBase(pair) ? await calculateReleaseAmount(order, pair) : order.remaining

  logger.debug(`Releasing ${releaseAmount} reserve for cancelled sell order ${order.id}`)

  return releaseReserve({
    currencyId: pair.base.id,
    accountId: order.accountId,
    amount: releaseAmount,
    sourceEventId: order.id!,
    sourceEventType: SourceEventType.orderCancellation,
  })
}

async function calculateReleaseAmount(order: Order, pair: SymbolPair): Promise<number> {
  const { maxDecimals: maxDecimalsForCurrency } = await findBoundaryForCurrency(pair.base.code)
  const { rows: tradeTransactionsForOrder } = await findTradeTransactions({ where: { orderId: order.id! } })

  const initialReserve = await retrieveInitialReserveForOrder(order)
  let remainingReserve = initialReserve

  if (tradeTransactionsForOrder.length > 0) {
    const totalOrderBaseAmount = calculateTotalOrderBaseAmountFromTradeTransactions(tradeTransactionsForOrder, pair, maxDecimalsForCurrency)

    remainingReserve = new Decimal(remainingReserve).minus(totalOrderBaseAmount).toNumber()
  }

  return remainingReserve
}

function calculateTotalOrderBaseAmountFromTradeTransactions(
  tradeTransactionsForOrder: TradeTransaction[],
  pair: SymbolPair,
  maxDecimalsForCurrency: number,
): Decimal {
  return tradeTransactionsForOrder.reduce((acc, { amount, fee }) => {
    const amountWithFees = feeTakenFromBase(pair)
      ? new Decimal(amount)
          .plus(fee)
          .toDP(maxDecimalsForCurrency, Decimal.ROUND_DOWN)
          .toNumber()
      : amount

    return new Decimal(acc).plus(amountWithFees)
  }, new Decimal(0))
}
