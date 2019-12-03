import { Order } from './order'

export type CoreOrderDetails = Pick<
  Order,
  'id' | 'symbolId' | 'createdAt' | 'orderType' | 'amount' | 'remaining' | 'direction' | 'limitPrice' | 'status' | 'globalTransactionId'
>
