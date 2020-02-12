import Decimal from 'decimal.js'
import { Transaction } from 'sequelize'
import { BalanceChangeParams, SourceEventType } from '@abx-types/balance'
import { determineMaxReserveForTradeValue } from '../../../../core'
import { OrderMatch } from '@abx-types/order'
import { SymbolPair } from '@abx-types/reference-data'
import { OrderSettlementHandler } from './order_settlement_handler'
import { feeTakenFromBase, findBoundaryForCurrency } from '@abx-service-clients/reference-data'
import { finaliseReserve, updateAvailable } from '@abx-service-clients/balance'

export class SellerOrderSettlementHandler extends OrderSettlementHandler {
  private static instance: SellerOrderSettlementHandler

  /** Creates and returns a {@link SellerOrderSettlementHandler} instance, if one already created returns that. */
  public static getInstance(): SellerOrderSettlementHandler {
    if (!this.instance) {
      this.instance = new SellerOrderSettlementHandler()
    }

    return this.instance
  }

  constructor() {
    super()
  }

  public async releaseReserveBalance(
    { amount, sellAccountId }: OrderMatch,
    sellerFee: number,
    pair: SymbolPair,
    sellerTransactionId: number,
    transaction: Transaction,
  ) {
    const { maxDecimals: maxDecimalsForCurrency } = await findBoundaryForCurrency(pair.base.code)

    const amountPaid = feeTakenFromBase(pair)
      ? new Decimal(amount)
          .plus(sellerFee)
          .toDP(maxDecimalsForCurrency, Decimal.ROUND_DOWN)
          .toNumber()
      : amount

    const initialReserve = feeTakenFromBase(pair)
      ? await determineMaxReserveForTradeValue({
          amount,
          accountId: sellAccountId,
          symbolId: pair.id,
          maxDecimalsForCurrency,
          feeCurrencyCode: pair.fee.code,
          t: transaction,
        })
      : amountPaid

    const sellerReleaseAction = {
      accountId: sellAccountId,
      amount: amountPaid,
      initialReserve,
      currencyId: pair.base.id,
      sourceEventId: sellerTransactionId,
      sourceEventType: SourceEventType.orderMatchRelease,
    }

    return finaliseReserve(sellerReleaseAction)
  }

  public async updateAvailableBalance(orderMatch: OrderMatch, sellerFee: number, pair: SymbolPair, sellerTransactionId: number) {
    const { maxDecimals: maxQuoteDecimals } = await findBoundaryForCurrency(pair.quote.code)
    const tradeValueNoFees = new Decimal(orderMatch.amount).times(orderMatch.matchPrice)

    const sellerQuoteIncrease = feeTakenFromBase(pair)
      ? tradeValueNoFees.toDP(maxQuoteDecimals, Decimal.ROUND_DOWN).toNumber()
      : tradeValueNoFees
          .minus(sellerFee)
          .toDP(maxQuoteDecimals, Decimal.ROUND_DOWN)
          .toNumber()

    const sellerUpdateAvailableQuote: BalanceChangeParams = {
      accountId: orderMatch.sellAccountId,
      amount: sellerQuoteIncrease,
      currencyId: pair.quote.id,
      sourceEventId: sellerTransactionId,
      sourceEventType: SourceEventType.orderMatch,
    }

    return updateAvailable(sellerUpdateAvailableQuote)
  }

  public getAccountId({ sellAccountId }: OrderMatch) {
    return sellAccountId
  }
}
