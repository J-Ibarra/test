import { OrderMatch } from '../core'
import { Tax } from '.'
import { FiatCurrency } from '@abx-types/reference-data'

export interface FeeDetail {
  fee: number
  feeRate: number
}

export interface TradeTransactionCall {
  orderMatch: OrderMatch
  buyerFeeDetail: FeeDetail
  buyerTax: Tax
  sellerFeeDetail: FeeDetail
  sellerTax: Tax
  feeCurrency: number
  buyerFiatCurrencyCode: FiatCurrency
  buyerBaseFiatConversion: number
  buyerQuoteFiatConversion: number
  sellerFiatCurrencyCode: FiatCurrency
  sellerBaseFiatConversion: number
  sellerQuoteFiatConversion: number
}
