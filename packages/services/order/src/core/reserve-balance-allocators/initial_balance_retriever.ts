import { CurrencyCode } from '@abx-types/reference-data'
import { Order, OrderDirection } from '@abx-types/order'
import { getOrderBalanceReserveAdjustment } from '@abx-service-clients/balance'

export async function retrieveInitialReserveForOrder({ id: orderId, accountId, symbolId, direction }: Order) {
  const currencyCode = direction === OrderDirection.buy ? (symbolId.slice(-3) as CurrencyCode) : (symbolId.substring(0, 3) as CurrencyCode)

  const reserveBalanceAdjustmentForTrade = await getOrderBalanceReserveAdjustment(currencyCode, accountId, orderId!)

  return Math.abs(reserveBalanceAdjustmentForTrade.delta)
}
