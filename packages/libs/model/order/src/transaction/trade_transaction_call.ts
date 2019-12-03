import { OrderMatch, FiatCurrency } from '../core'
import { Tax } from '.'
import { Transaction } from 'sequelize'

export interface TradeTransactionCall {
  orderMatch: OrderMatch
  buyerFee: number
  buyerTax: Tax
  sellerFee: number
  sellerTax: Tax
  feeCurrency: number
  buyerFiatCurrencyCode: FiatCurrency
  buyerBaseFiatConversion: number
  buyerQuoteFiatConversion: number
  sellerFiatCurrencyCode: FiatCurrency
  sellerBaseFiatConversion: number
  sellerQuoteFiatConversion: number
  t?: Transaction
}
