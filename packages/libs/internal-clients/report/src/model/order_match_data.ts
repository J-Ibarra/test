import { CurrencyCode } from '@abx-types/reference-data'
import { OrderDirection } from '@abx-types/order'

export interface OrderMatchData {
  orderMatchId: number
  /**
   * The buy or sell account id, depending on the trading party
   */
  accountId: string
  orderIds: {
    buyOrderId: number
    sellOrderId: number
  }
  /**
   * The 'base' currency the 'to' currency is bought with or sold for
   */
  baseCurrency: CurrencyCode
  /**
   * The 'to' currency being bought or sold
   */
  quoteCurrency: CurrencyCode
  direction: OrderDirection
  date: Date
  /**
   * How many units were traded
   */
  amount: number
  /**
   * The price of the order match, i.e. the unit price
   */
  matchPrice: number
  /**
   * The total value of the trade: unit price * amount
   */
  consideration: number
}
