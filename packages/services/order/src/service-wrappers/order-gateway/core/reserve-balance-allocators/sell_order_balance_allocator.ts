import { Transaction } from 'sequelize'

import { createReserve } from '@abx-service-clients/balance'
import { SourceEventType } from '@abx-types/balance'
import { Logger } from '@abx/logging'
import { SymbolPair } from '@abx-types/reference-data'
import { Order } from '@abx-types/order'
import { findBoundaryForCurrency, feeTakenFromBase } from '@abx-service-clients/reference-data'
import { determineMaxReserveForTradeValue } from '../../../../core'

const logger = Logger.getInstance('contract_exchange', 'allocateSellOrderReserveBalance')

export async function allocateSellOrderReserveBalance(order: Order, pair: SymbolPair, transaction: Transaction): Promise<void> {
  const balanceToReserve = await calculateTotalBaseAmountRequired(order, pair, transaction)
  logger.debug(`Creating reserve of ${balanceToReserve} ${pair.base.code} for seller ${order.accountId}`)

  return createReserve({
    currencyId: pair.base.id,
    accountId: order.accountId,
    amount: balanceToReserve,
    sourceEventId: order.id!,
    sourceEventType: 'order' as SourceEventType,
    t: transaction,
  })
}

/**
 * Calculates the total amount to reserve - trade amount + executionFee
 * !!! executionFee will only be calculated at this instance if the fee is taken from the base currency
 * A {@link ValidationError} is thrown if there is not enough funds in the base currency available balance
 * of the account to cover the total trade value.
 *
 * @param order the buy order details
 * @param pair the currency pair traded
 * @param transaction the parent transaction
 * @returns the total amount to be reserved
 */
export async function calculateTotalBaseAmountRequired(order: Order, pair: SymbolPair, transaction: Transaction): Promise<number> {
  const { maxDecimals: maxDecimalsForCurrency } = await findBoundaryForCurrency(pair.base.code)

  return feeTakenFromBase(pair)
    ? await determineMaxReserveForTradeValue({
        amount: order.amount,
        accountId: order.accountId,
        symbolId: order.symbolId,
        maxDecimalsForCurrency,
        feeCurrencyCode: pair.fee.code,
        t: transaction,
      })
    : order.amount
}
