import Decimal from 'decimal.js'
import process from 'process'

import { findOrCreateOperatorAccount } from '@abx-service-clients/account'
import { recordCustomEvent } from 'newrelic'
import { Transaction } from 'sequelize'
import { SourceEventType } from '@abx-types/balance'
import { findBoundaryForCurrency, getVatRate, getCompleteSymbolDetails, getCurrencyCode, isFiatCurrency } from '@abx-service-clients/reference-data'
import { Logger } from '@abx/logging'
import { OrderMatch, UsdMidPriceEnrichedOrderMatch } from '@abx-types/order'
import { CurrencyCode, FiatCurrency, SymbolPair } from '@abx-types/reference-data'
import { Tax, TradeTransactionCall } from '@abx-types/order'
import { BuyerOrderSettlementHandler, FeeDetail, SellerOrderSettlementHandler } from './handler'
import { getVatFees } from './vat_handler'
import { OrderMatchRepository, AccountTradeVolumeAccumulator, publishOrderExecutionResultEvent, createTradeTransactionPair } from '../../../core'
import { updateAvailable } from '@abx-service-clients/balance'
import { convertAmountToFiatCurrency } from '@abx-utils/fx-rate'

export class OrderSettlementGateway {
  private logger = Logger.getInstance('lib', 'OrderSettlementGateway')
  private static instance: OrderSettlementGateway

  /** Creates and returns a {@link OrderSettlementGateway} instance, if one already created returns that. */
  public static getInstance(): OrderSettlementGateway {
    if (!this.instance) {
      this.instance = new OrderSettlementGateway()
    }

    return this.instance
  }

  constructor(
    private buyerOrderSettlementHandler = BuyerOrderSettlementHandler.getInstance(),
    private sellerOrderSettlementHandler = SellerOrderSettlementHandler.getInstance(),
    private accountTradeVolumeAccumulator = AccountTradeVolumeAccumulator.getInstance(),
    private orderMatchRepository = OrderMatchRepository.getInstance(),
  ) {}

  public async settleOrderMatch(orderMatch: UsdMidPriceEnrichedOrderMatch, transaction: Transaction) {
    this.logger.info(`Settling order match ${orderMatch.id}`)
    const matchedSymbol = await getCompleteSymbolDetails(orderMatch.symbolId)

    const [buyerFeeDetail, sellerFeeDetail] = await this.calculateFees(orderMatch, matchedSymbol, transaction)
    const [buyerTax, sellerTax] = await this.calculateTax(buyerFeeDetail.fee, sellerFeeDetail.fee, orderMatch, matchedSymbol)

    const {
      buyerPreferredFiatCurrencyCode,
      buyerFiatConversionForQuote,
      buyerFiatConversionForBase,
      sellerPreferredFiatCurrencyCode,
      sellerFiatConversionForQuote,
      sellerFiatConversionForBase,
    } = await this.getPreferredCurrencyConversions(matchedSymbol, orderMatch)

    const [buyerTx, sellerTx] = await this.createBuyAndSellTransactions(
      orderMatch,
      buyerFeeDetail,
      buyerTax,
      sellerFeeDetail,
      sellerTax,
      matchedSymbol.fee.id,
      transaction,
      buyerPreferredFiatCurrencyCode,
      buyerFiatConversionForBase,
      buyerFiatConversionForQuote,
      sellerPreferredFiatCurrencyCode,
      sellerFiatConversionForBase,
      sellerFiatConversionForQuote,
    )

    await this.updateTradingPartiesBalances(
      matchedSymbol,
      buyerFeeDetail.fee,
      buyerTx.id!,
      sellerFeeDetail.fee,
      sellerTx.id!,
      orderMatch,
      transaction,
    )

    await this.transferFeesIntoOperatorAccount(buyerFeeDetail.fee, sellerFeeDetail.fee, matchedSymbol.fee.id, buyerTx.id!, transaction)
    this.logger.debug(
      `The sum of ${buyerFeeDetail.fee} and ${sellerFeeDetail.fee} has been added to operator account for currency ${matchedSymbol.base.code}`,
    )

    await this.updateMonthlyTradeVolumeForBuyerAndSeller(orderMatch, transaction)
    this.logger.debug(`Monthly total trade amount has been increased for buyer and seller`)

    await this.orderMatchRepository.setOrderMatchStatusToSettled(orderMatch.id!, transaction)
    this.logger.info(`Order match ${orderMatch.id} settled`)

    process.nextTick(() => {
      publishOrderExecutionResultEvent(orderMatch.buyOrderId)
      publishOrderExecutionResultEvent(orderMatch.sellOrderId)
    })

    recordCustomEvent('event_order_match_settled', {
      symbolId: orderMatch.symbolId,
      amount: orderMatch.amount,
      matchPrice: orderMatch.matchPrice,
    })
  }

  private async calculateFees(orderMatch: OrderMatch, symbol: SymbolPair, transaction: Transaction): Promise<FeeDetail[]> {
    const buyerFeeDetail = await this.buyerOrderSettlementHandler.calculateFee(orderMatch, symbol, transaction)
    this.logger.debug(`Calculated buy fee of ${buyerFeeDetail} for order match ${orderMatch.id}`)

    const sellerFeeDetail = await this.sellerOrderSettlementHandler.calculateFee(orderMatch, symbol, transaction)
    this.logger.debug(`Calculated sell fee of ${sellerFeeDetail} for order match ${orderMatch.id}`)

    return [buyerFeeDetail, sellerFeeDetail]
  }

  private async calculateTax(buyerFee: number, sellerFee: number, orderMatch: UsdMidPriceEnrichedOrderMatch, symbol: SymbolPair): Promise<Tax[]> {
    const vatRate = await getVatRate()
    const { buyerVatAmount, sellerVatAmount } = await getVatFees({
      buyerExecutionFee: buyerFee,
      sellerExecutionFee: sellerFee,
      orderMatch,
      symbol,
      vatRate,
    })

    const buyerTax: Tax = {
      rate: vatRate,
      valueInFeeCurrency: buyerVatAmount.valueInFeeCurrency,
      valueInCHF: buyerVatAmount.valueInCHF,
    }

    const sellerTax: Tax = {
      rate: vatRate,
      valueInFeeCurrency: sellerVatAmount.valueInFeeCurrency,
      valueInCHF: sellerVatAmount.valueInCHF,
    }
    return [buyerTax, sellerTax]
  }

  private async updateTradingPartiesBalances(
    symbol: SymbolPair,
    buyerFee: number,
    buyerTransactionId: number,
    sellerFee: number,
    sellerTransactionId: number,
    orderMatch: OrderMatch,
    transaction: Transaction,
  ) {
    await this.buyerOrderSettlementHandler.settleOrderMatch(symbol, buyerFee, buyerTransactionId, orderMatch, transaction)
    this.logger.debug(`Updated buyer reserved and available balances for order match ${orderMatch.id}`)

    await this.sellerOrderSettlementHandler.settleOrderMatch(symbol, sellerFee, sellerTransactionId, orderMatch, transaction)
    this.logger.debug(`Updated seller reserved and available balances for order match ${orderMatch.id}`)
  }

  private async transferFeesIntoOperatorAccount(
    buyerFee: number,
    sellerFee: number,
    feeCurrencyId: number,
    buyerTransactionId: number,
    t: Transaction,
  ) {
    const operator = await findOrCreateOperatorAccount()
    const feeCurrencyCode = await getCurrencyCode(feeCurrencyId)
    const { maxDecimals: maxFeeDecimals } = await findBoundaryForCurrency(feeCurrencyCode!)

    const opFees = new Decimal(buyerFee)
      .plus(sellerFee)
      .toDP(maxFeeDecimals, Decimal.ROUND_DOWN)
      .toNumber()

    const feesToOperator = {
      accountId: operator.id,
      amount: opFees,
      currencyId: feeCurrencyId,
      sourceEventId: buyerTransactionId,
      sourceEventType: SourceEventType.orderMatch,
      t,
    }

    await updateAvailable(feesToOperator)
  }

  private updateMonthlyTradeVolumeForBuyerAndSeller(orderMatch: OrderMatch, transaction: Transaction) {
    return Promise.all([
      this.accountTradeVolumeAccumulator.incrementMonthlyTradeAccumulationForAccount({
        accountId: orderMatch.sellAccountId,
        amount: orderMatch.amount,
        price: orderMatch.matchPrice,
        symbolId: orderMatch.symbolId,
        date: new Date(),
        transaction: transaction as any,
      }),
      this.accountTradeVolumeAccumulator.incrementMonthlyTradeAccumulationForAccount({
        accountId: orderMatch.buyAccountId,
        amount: orderMatch.amount,
        price: orderMatch.matchPrice,
        symbolId: orderMatch.symbolId,
        date: new Date(),
        transaction: transaction as any,
      }),
    ])
  }

  private createBuyAndSellTransactions(
    orderMatch: OrderMatch,
    buyerFeeDetail: FeeDetail,
    buyerTax: Tax,
    sellerFeeDetail: FeeDetail,
    sellerTax: Tax,
    feeCurrencyId: number,
    transaction: Transaction,
    buyerFiatCurrencyCode: FiatCurrency,
    buyerBaseFiatConversion: number,
    buyerQuoteFiatConversion: number,
    sellerFiatCurrencyCode: FiatCurrency,
    sellerBaseFiatConversion: number,
    sellerQuoteFiatConversion: number,
  ) {
    const tradeTxCall: TradeTransactionCall = {
      orderMatch,
      buyerFeeDetail,
      buyerTax,
      sellerFeeDetail,
      sellerTax,
      feeCurrency: feeCurrencyId,
      t: transaction,
      buyerBaseFiatConversion,
      buyerQuoteFiatConversion,
      buyerFiatCurrencyCode,
      sellerBaseFiatConversion,
      sellerQuoteFiatConversion,
      sellerFiatCurrencyCode,
    } as any

    return createTradeTransactionPair(tradeTxCall, transaction)
  }

  private async getPreferredCurrencyConversions(symbolPair: SymbolPair, { amount, matchPrice }: OrderMatch) {
    const buyerPreferredFiatCurrencyCode: FiatCurrency = isFiatCurrency(CurrencyCode.usd)
      ? FiatCurrency.usd // TODO: grab users preferred currency
      : FiatCurrency.usd

    const buyerFiatConversionForQuote: number = +(await convertAmountToFiatCurrency(
      symbolPair.quote.code,
      buyerPreferredFiatCurrencyCode,
      new Decimal(amount).times(matchPrice).toNumber(),
    ))

    const buyerFiatConversionForBase: number = +(await convertAmountToFiatCurrency(
      symbolPair.base.code,
      buyerPreferredFiatCurrencyCode,
      new Decimal(amount).toNumber(),
    ))

    const sellerPreferredFiatCurrencyCode: FiatCurrency = isFiatCurrency(CurrencyCode.usd)
      ? FiatCurrency.usd // TODO: grab users preferred currency
      : FiatCurrency.usd

    const sellerFiatConversionForQuote: number = +(await convertAmountToFiatCurrency(
      symbolPair.quote.code,
      sellerPreferredFiatCurrencyCode,
      new Decimal(amount).times(matchPrice).toNumber(),
    ))

    const sellerFiatConversionForBase: number = +(await convertAmountToFiatCurrency(symbolPair.base.code, sellerPreferredFiatCurrencyCode, amount))
    return {
      buyerPreferredFiatCurrencyCode,
      buyerFiatConversionForQuote,
      buyerFiatConversionForBase,
      sellerPreferredFiatCurrencyCode,
      sellerFiatConversionForQuote,
      sellerFiatConversionForBase,
    }
  }
}
