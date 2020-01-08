import { OrderDirection } from '@abx-types/order'

export interface TradeTransactionDataFromOrderMatch {
  orderMatchId: number
  orderIds: {
    buyOrderId: number
    sellOrderId: number
  }
  direction: OrderDirection
}
