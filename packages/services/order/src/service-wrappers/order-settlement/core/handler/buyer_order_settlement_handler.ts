import Decimal from 'decimal.js'
import { Transaction } from 'sequelize'
import { SourceEventType } from '@abx-types/balance'
import { findOrder, determineMaxBuyReserve, findOrderMatchTransactions, retrieveInitialReserveForOrder } from '../../../../core'
import { Order, OrderMatch, OrderMatchStatus, OrderStatus, OrderType } from '@abx-types/order'
import { SymbolPair } from '@abx-types/reference-data'
import { OrderSettlementHandler } from './order_settlement_handler'
import { retrieveTotalReleasedAmountForOrder } from './shared.utils'
import { findBoundaryForCurrency, feeTakenFromBase } from '@abx-service-clients/reference-data'
import { finaliseReserve, updateAvailable } from '@abx-service-clients/balance'

export class BuyerOrderSettlementHandler extends OrderSettlementHandler {
  private static instance: BuyerOrderSettlementHandler

  /** Creates and returns a {@link BuyerOrderSettlementHandler} instance, if one already created returns that. */
  public static getInstance(): BuyerOrderSettlementHandler {
    if (!this.instance) {
      this.instance = new BuyerOrderSettlementHandler()
    }

    return this.instance
  }

  constructor() {
    super()
  }

  public async releaseReserveBalance(orderMatch: OrderMatch, buyerFee: number, pair: SymbolPair, transactionId: number, transaction: Transaction) {
    const { maxDecimals: maxQuoteDecimals } = await findBoundaryForCurrency(pair.quote.code)
    const order = await findOrder(orderMatch.buyOrderId, transaction)

    const allMatchesSettledExceptForCurrentOne = await this.allMatchesSettledExceptForCurrentOne(orderMatch.id!, order!.id!, transaction)
    const totalReleasedUntilNow = await retrieveTotalReleasedAmountForOrder(order!, pair)

    const { remainingReserve, initialReserve } = await this.computeRemainingReserve(
      order!,
      maxQuoteDecimals,
      totalReleasedUntilNow,
      transaction,
      orderMatch,
      pair,
      allMatchesSettledExceptForCurrentOne,
    )
    const releaseAmount = await this.calculateReleaseAmount(
      orderMatch,
      order!,
      buyerFee,
      maxQuoteDecimals,
      pair,
      initialReserve!,
      allMatchesSettledExceptForCurrentOne,
      totalReleasedUntilNow,
    )

    return finaliseReserve({
      accountId: orderMatch.buyAccountId,
      amount: releaseAmount,
      currencyId: pair.quote.id,
      sourceEventId: transactionId,
      sourceEventType: SourceEventType.orderMatchRelease,
      initialReserve: remainingReserve!,
    })
  }

  /**
   * The initial reserve is computed using the limit price of the order,
   * if it is a limit order, otherwise match price is used.
   */
  private async computeRemainingReserve(
    order: Order,
    maxDecimalsForCurrency: number,
    totalReleasedUntilNow: number,
    transaction: Transaction,
    orderMatch: OrderMatch,
    pair: SymbolPair,
    allMatchesSettledExceptForCurrentOne: boolean,
  ): Promise<{ remainingReserve: number; initialReserve?: number }> {
    if (order.orderType !== OrderType.market && order.status === OrderStatus.fill && allMatchesSettledExceptForCurrentOne) {
      const initialReserve = await retrieveInitialReserveForOrder(order)

      return {
        remainingReserve: new Decimal(initialReserve)
          .minus(totalReleasedUntilNow)
          .toDP(maxDecimalsForCurrency, Decimal.ROUND_DOWN)
          .toNumber(),
        initialReserve,
      }
    }

    const reserve = await this.computeExpectedReserveForOrderMatch(order, orderMatch, pair, maxDecimalsForCurrency, transaction)

    return {
      remainingReserve: reserve,
    }
  }

  private async calculateReleaseAmount(
    orderMatch: OrderMatch,
    order: Order,
    buyerFee: number,
    maxQuoteDecimals: number,
    pair: SymbolPair,
    initialReserve: number,
    allMatchesSettledExceptForCurrentOne: boolean,
    totalReleasedUntilNow: number,
  ) {
    if (
      order.orderType !== OrderType.market &&
      order.status === OrderStatus.fill &&
      allMatchesSettledExceptForCurrentOne &&
      order.limitPrice === orderMatch.matchPrice
    ) {
      return new Decimal(initialReserve)
        .minus(totalReleasedUntilNow)
        .toDP(maxQuoteDecimals, Decimal.ROUND_DOWN)
        .toNumber()
    }

    return this.calculateReleaseForPartiallyFilledOrder(orderMatch, pair, buyerFee, maxQuoteDecimals)
  }

  private async calculateReleaseForPartiallyFilledOrder(
    orderMatch: OrderMatch,
    pair: SymbolPair,
    buyerFee: number,
    maxQuoteDecimals: number,
  ): Promise<number> {
    const tradeValueNoFees = new Decimal(orderMatch.amount).times(orderMatch.matchPrice)

    return feeTakenFromBase(pair)
      ? tradeValueNoFees.toDP(maxQuoteDecimals, Decimal.ROUND_DOWN).toNumber()
      : tradeValueNoFees
          .plus(buyerFee)
          .toDP(maxQuoteDecimals, Decimal.ROUND_DOWN)
          .toNumber()
  }

  private async allMatchesSettledExceptForCurrentOne(currentOrderMatchId: number, orderId: number, transaction: Transaction): Promise<boolean> {
    const orderMatches = await findOrderMatchTransactions({ where: { buyOrderId: orderId } }, transaction)

    return !orderMatches.find(({ id, status }) => id !== currentOrderMatchId && status === OrderMatchStatus.matched)
  }
  /**
   * The initial reserve is computed using the limit price of the order,
   * if it is a limit order, otherwise match price is used.
   */
  private async computeExpectedReserveForOrderMatch(
    order: Order,
    orderMatch: OrderMatch,
    pair: SymbolPair,
    maxDecimalsForCurrency: number,
    transaction: Transaction,
  ): Promise<number> {
    const initialOrderMatchReserveNoFees = new Decimal(orderMatch.amount)
      .times(order.limitPrice || orderMatch.matchPrice)
      .toDP(maxDecimalsForCurrency, Decimal.ROUND_DOWN)
      .toNumber()

    return feeTakenFromBase(pair)
      ? initialOrderMatchReserveNoFees
      : await determineMaxBuyReserve({
          orderId: order.id!,
          amount: orderMatch.amount,
          price: order.limitPrice || orderMatch.matchPrice,
          accountId: orderMatch.buyAccountId,
          symbolId: orderMatch.symbolId,
          feeCurrencyCode: pair.fee.code,
          maxDecimalsForCurrency,
          transaction,
        })
  }

  public async updateAvailableBalance(orderMatch: OrderMatch, buyerFee: number, pair: SymbolPair, buyerTransactionId: number) {
    const { maxDecimals: maxBaseDecimals } = await findBoundaryForCurrency(pair.base.code)
    const amountToReceive = feeTakenFromBase(pair)
      ? new Decimal(orderMatch.amount)
          .minus(buyerFee)
          .toDP(maxBaseDecimals, Decimal.ROUND_DOWN)
          .toNumber()
      : orderMatch.amount

    return updateAvailable({
      accountId: orderMatch.buyAccountId,
      amount: amountToReceive,
      currencyId: pair.base.id,
      sourceEventId: buyerTransactionId,
      sourceEventType: SourceEventType.orderMatch,
    })
  }

  public getAccountId({ buyAccountId }: OrderMatch) {
    return buyAccountId
  }
}
