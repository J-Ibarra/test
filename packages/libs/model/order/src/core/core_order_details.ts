import { Order } from './order'

export type CoreOrderDetails = Pick<
  Order,
  'id' | 'symbolId' | 'createdAt' | 'updatedAt' | 'orderType' | 'amount' | 'remaining' | 'direction' | 'limitPrice' | 'status' | 'globalTransactionId'
>
