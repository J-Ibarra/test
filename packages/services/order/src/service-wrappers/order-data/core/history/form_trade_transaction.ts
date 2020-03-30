import Decimal from 'decimal.js'

import { Logger } from '@abx-utils/logging'
import { OrderDirection, TradeTransaction, TransactionType } from '@abx-types/order'
import { CurrencyCode, SymbolPair, CurrencyBoundary } from '@abx-types/reference-data'
import { TransactionHistory, TransactionHistoryDirection } from './model'

const logger = Logger.getInstance('order-data', 'form_trade_Transaction')

/**
 * Form Order type balance adjustment to history
 * @param tradeTransaction
 * @param selectedCurrencyCode
 */
export function formTradeTransactionToHistory(
  tradeTransaction: TradeTransaction,
  selectedCurrencyCode: CurrencyCode,
  allSymbols: SymbolPair[],
  currencyBoundaries: CurrencyBoundary[],
): TransactionHistory {
  logger.debug(`Traded transaction: ${JSON.stringify(tradeTransaction)}`)
  logger.debug(`selected currency code: ${selectedCurrencyCode}, symbols: ${JSON.stringify(allSymbols)}`)
  const tradeSymbol = allSymbols.find(symbol => symbol.id === tradeTransaction.symbolId)
  const feeCurrency = tradeSymbol!.fee
  logger.debug(`Traded symbol: ${JSON.stringify(tradeSymbol)}`)

  const { primaryAmount, memo, direction, preferredCurrencyAmount } = formResult(
    tradeTransaction,
    selectedCurrencyCode,
    tradeSymbol!,
    currencyBoundaries.find(({ currencyId }) => currencyId === feeCurrency.id)!,
  )

  return {
    transactionType: TransactionType.trade,
    primaryCurrencyCode: selectedCurrencyCode,
    primaryAmount,
    preferredCurrencyCode: tradeTransaction.fiatCurrencyCode.toString() as CurrencyCode,
    preferredCurrencyAmount,
    title: `${selectedCurrencyCode} Exchange`,
    memo,
    direction,
    createdAt: tradeTransaction.createdAt!,
    transactionId: tradeTransaction.id,
    fee: tradeTransaction.fee,
    feeCurrency: feeCurrency.code,
  } as TransactionHistory
}

const formResult = (
  tradeTransaction: TradeTransaction,
  selectedCurrency: CurrencyCode,
  tradeSymbol: SymbolPair,
  feeCurrencyBoundary: CurrencyBoundary,
) => {
  const selectedCurrencyIsBase = tradeSymbol.base.code === selectedCurrency
  const directionIsSell = tradeTransaction.direction === OrderDirection.sell
  const feeIsTakenFromBase = tradeSymbol.base.code === tradeSymbol.fee.code

  const { tradeAmount, preferredCurrencyAmount } = selectedCurrencyIsBase
    ? calculateTradeAndPreferredCurrencyAmountsForBaseCurrency(
        feeIsTakenFromBase,
        directionIsSell,
        tradeSymbol,
        tradeTransaction,
        feeCurrencyBoundary,
      )
    : calculateTradeAndPreferredCurrencyAmountsForQuoteCurrency(
        feeIsTakenFromBase,
        directionIsSell,
        tradeSymbol,
        tradeTransaction,
        feeCurrencyBoundary,
      )

  const memo = `${tradeSymbol.base.code} ${directionIsSell ? 'sold for' : 'purchased with'} ${tradeSymbol.quote.code}`
  const direction = tradeAmount < 0 ? TransactionHistoryDirection.outgoing : TransactionHistoryDirection.incoming

  return { primaryAmount: tradeAmount, memo, direction, preferredCurrencyAmount }
}

const calculateTradeAndPreferredCurrencyAmountsForBaseCurrency = (
  feeIsTakenFromBase: boolean,
  directionIsSell: boolean,
  tradeSymbol: SymbolPair,
  tradeTransaction: TradeTransaction,
  feeCurrencyBoundary: CurrencyBoundary,
) => {
  const tradeAmount = directionIsSell ? -tradeTransaction.amount : tradeTransaction.amount
  logger.info(`Trade amount ${tradeAmount}`)
  let tradeAmountAfterFeeTaken = tradeAmount

  if (feeIsTakenFromBase) {
    tradeAmountAfterFeeTaken = new Decimal(tradeAmount)
      .minus(tradeTransaction.fee)
      .toDP(feeCurrencyBoundary.maxDecimals, Decimal.ROUND_DOWN)
      .toNumber()
  }

  let fiatConversionRate
  if (tradeSymbol.quote.code !== CurrencyCode.usd) {
    fiatConversionRate = new Decimal(tradeTransaction.baseFiatConversion).div(tradeTransaction.amount)
  } else {
    fiatConversionRate = tradeTransaction.matchPrice
  }

  const preferredCurrencyAmount = new Decimal(tradeAmount).times(fiatConversionRate).toNumber()

  logger.info(`Trade amount after fee taken ${tradeAmountAfterFeeTaken}`)
  return { tradeAmount: tradeAmountAfterFeeTaken, preferredCurrencyAmount }
}

const calculateTradeAndPreferredCurrencyAmountsForQuoteCurrency = (
  feeIsTakenFromBase: boolean,
  directionIsSell: boolean,
  tradeSymbol: SymbolPair,
  tradeTransaction: TradeTransaction,
  feeCurrencyBoundary: CurrencyBoundary,
) => {
  const price = tradeTransaction.matchPrice
  const tradeAmountDecimal = new Decimal(tradeTransaction.amount)
  let tradeAmount = 0

  if (!feeIsTakenFromBase) {
    tradeAmount = directionIsSell
      ? tradeAmountDecimal
          .times(price)
          .minus(tradeTransaction.fee)
          .toDP(feeCurrencyBoundary.maxDecimals, Decimal.ROUND_DOWN)
          .toNumber()
      : tradeAmountDecimal
          .times(-1)
          .times(price)
          .minus(tradeTransaction.fee)
          .toDP(feeCurrencyBoundary.maxDecimals, Decimal.ROUND_DOWN)
          .toNumber()
  } else {
    tradeAmount = directionIsSell
      ? tradeAmountDecimal.times(price).toNumber()
      : tradeAmountDecimal
          .times(-1)
          .times(price)
          .toNumber()
  }

  let fiatConversionRate
  if (tradeSymbol.quote.code !== CurrencyCode.usd) {
    fiatConversionRate = new Decimal(tradeTransaction.quoteFiatConversion).div(tradeAmountDecimal.times(price))
  } else {
    fiatConversionRate = 1
  }

  const preferredCurrencyAmount = new Decimal(tradeAmount).times(fiatConversionRate).toNumber()

  return { tradeAmount, preferredCurrencyAmount }
}
