import { Transaction } from 'sequelize'
import { getModel } from '@abx/db-connection-utils'
import { OrderDirection, TradeTransaction, TradeTransactionCall } from '@abx-types/order'
import { getTradeTransactionIdPair } from './get_trade_transaction_id_pair'

// This just creates the trade transactions. The order module will handle reserve
// releasing and balance transfer... I think. Depending how simple it is

export async function createTradeTransactionPair(tradeTxCall: TradeTransactionCall, t: Transaction) {
  const [tradeId1, tradeId2] = await getTradeTransactionIdPair(tradeTxCall.t as any)

  const buyerTradeTransaction: TradeTransaction = {
    id: tradeId1,
    counterTradeTransactionId: tradeId2,
    direction: OrderDirection.buy,
    symbolId: tradeTxCall.orderMatch.symbolId,
    accountId: tradeTxCall.orderMatch.buyAccountId,
    orderId: tradeTxCall.orderMatch.buyOrderId,
    amount: tradeTxCall.orderMatch.amount,
    matchPrice: tradeTxCall.orderMatch.matchPrice,
    fee: tradeTxCall.buyerFeeDetail.fee,
    feeRate: tradeTxCall.buyerFeeDetail.feeRate,
    feeCurrencyId: tradeTxCall.feeCurrency,
    taxAmountCHF: tradeTxCall.buyerTax.valueInCHF.toNumber(),
    taxAmountFeeCurrency: tradeTxCall.buyerTax.valueInFeeCurrency.toNumber(),
    taxRate: tradeTxCall.buyerTax.rate,
    baseFiatConversion: tradeTxCall.buyerBaseFiatConversion,
    quoteFiatConversion: tradeTxCall.buyerQuoteFiatConversion,
    fiatCurrencyCode: tradeTxCall.buyerFiatCurrencyCode,
  }

  const sellerTradeTransaction: TradeTransaction = {
    id: tradeId2,
    counterTradeTransactionId: tradeId1,
    direction: OrderDirection.sell,
    symbolId: tradeTxCall.orderMatch.symbolId,
    accountId: tradeTxCall.orderMatch.sellAccountId,
    orderId: tradeTxCall.orderMatch.sellOrderId,
    amount: tradeTxCall.orderMatch.amount,
    matchPrice: tradeTxCall.orderMatch.matchPrice,
    fee: tradeTxCall.sellerFeeDetail.fee,
    feeRate: tradeTxCall.sellerFeeDetail.feeRate,
    feeCurrencyId: tradeTxCall.feeCurrency,
    taxRate: tradeTxCall.sellerTax.rate,
    taxAmountCHF: tradeTxCall.sellerTax.valueInCHF.toNumber(),
    taxAmountFeeCurrency: tradeTxCall.sellerTax.valueInFeeCurrency.toNumber(),
    baseFiatConversion: tradeTxCall.sellerBaseFiatConversion,
    quoteFiatConversion: tradeTxCall.sellerQuoteFiatConversion,
    fiatCurrencyCode: tradeTxCall.sellerFiatCurrencyCode,
  }

  const transactions = await getModel<TradeTransaction>('tradeTransaction').bulkCreate([sellerTradeTransaction, buyerTradeTransaction], {
    transaction: t,
  })

  return transactions.map(trans => trans.get())
}
