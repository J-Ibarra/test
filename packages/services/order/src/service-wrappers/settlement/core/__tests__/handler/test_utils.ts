import { Order, OrderMatchStatus, OrderStatus, OrderType, OrderValidity } from '@abx-types/order'
import { CurrencyCode } from '@abx-types/reference-data'

export const createOrderMatch = (sellAccountId, buyAccountId, symbolId: string, orderAmount: number, orderMatchPrice: number) => ({
  symbolId,
  amount: orderAmount,
  matchPrice: orderMatchPrice,
  consideration: 1,
  sellAccountId,
  sellOrderId: 2,
  sellOrderType: OrderType.limit,
  buyAccountId,
  buyOrderId: 1,
  buyOrderType: OrderType.limit,
  status: OrderMatchStatus.matched,
})

export const createSymbol = (base: CurrencyCode, quote: CurrencyCode, fee: CurrencyCode) => ({
  id: `${base}_${quote}`,
  base: {
    id: 1,
    code: base,
    sortPriority: 1,
    orderPriority: 1,
  },
  quote: {
    id: 2,
    code: quote,
    sortPriority: 2,
    orderPriority: 2,
  },
  fee: {
    id: fee === base ? 1 : 2,
    code: fee,
    sortPriority: 3,
    orderPriority: 3,
  },
  orderRange: 0.3,
})

export const createOrder = ({
  orderId,
  accountId,
  symbolId,
  direction,
  orderType = OrderType.limit,
  amount = 10,
  limitPrice = 12.5,
  expiryDate = new Date(),
  remaining = 5,
  status = OrderStatus.submit,
}): Order => ({
  id: orderId,
  accountId,
  symbolId,
  direction,
  amount,
  remaining,
  status,
  orderType,
  validity: OrderValidity.GTC,
  limitPrice,
  expiryDate,
})
