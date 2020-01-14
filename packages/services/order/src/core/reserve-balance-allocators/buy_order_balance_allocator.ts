import Decimal from 'decimal.js'
import { Transaction } from 'sequelize'

import { createReserve } from '@abx-service-clients/balance'
import { SourceEventType } from '@abx-types/balance'
import { Logger } from '@abx/logging'
import { SymbolPair } from '@abx-types/reference-data'
import { Order } from '@abx-types/order'
import { feeTakenFromBase, findBoundaryForCurrency } from '@abx-service-clients/reference-data'
import { determineMaxBuyReserve } from '..'

const logger = Logger.getInstance('contract_exchange', 'allocateBuyOrderReserveBalance')

export async function allocateBuyOrderReserveBalance({
  order,
  pair,
  transaction,
  precalculatedReservePrice,
}: {
  order: Order
  pair: SymbolPair
  transaction: Transaction
  precalculatedReservePrice?: number
}): Promise<void> {
  const amountToReserve = precalculatedReservePrice || (await calculateTotalQuoteAmountRequired(order, pair))

  logger.debug(`Creating reserve of ${amountToReserve} ${pair.quote.code} for buyer ${order.accountId}`)

  return createReserve({
    currencyId: pair.quote.id,
    accountId: order.accountId,
    amount: amountToReserve,
    sourceEventId: order.id!,
    sourceEventType: 'order' as SourceEventType,
    t: transaction,
  })
}

export async function calculateTotalQuoteAmountRequired(order: Order, pair: SymbolPair): Promise<number> {
  const { maxDecimals: maxDecimalsForCurrency } = await findBoundaryForCurrency(pair.quote.code)

  return feeTakenFromBase(pair)
    ? new Decimal(order.amount)
        .times(order.limitPrice!)
        .toDP(maxDecimalsForCurrency, Decimal.ROUND_DOWN)
        .toNumber()
    : await determineMaxBuyReserve({
        orderId: order.id!,
        amount: order.amount,
        price: order.limitPrice!,
        accountId: order.accountId,
        symbolId: order.symbolId,
        feeCurrencyCode: pair.fee.code,
        maxDecimalsForCurrency,
        transaction: undefined,
      })
}
