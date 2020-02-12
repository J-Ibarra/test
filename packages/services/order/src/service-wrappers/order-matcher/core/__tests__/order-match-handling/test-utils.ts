import { CurrencyCode } from '@abx-types/reference-data'
import { Order, OrderStatus, OrderType, OrderValidity } from '@abx-types/order'

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
    id: 3,
    code: fee,
    sortPriority: 1,
    orderPriority: 1,
  },
  orderRange: 0.3,
})
