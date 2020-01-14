import { OrderDirection } from '../core/order_direction.enum'
import { FiatCurrency } from '@abx-types/reference-data'

export interface TradeTransaction {
  id?: number
  counterTradeTransactionId: number
  counterTrade?: TradeTransaction
  direction: OrderDirection
  symbolId: string
  accountId: string
  orderId: number
  amount: number
  matchPrice: number
  fee: number
  feeRate: number
  feeCurrencyId: number
  taxRate: number
  taxAmountCHF: number
  taxAmountFeeCurrency: number
  baseFiatConversion: number
  quoteFiatConversion: number
  fiatCurrencyCode: FiatCurrency
  createdAt?: Date
  updatedAt?: Date
}
