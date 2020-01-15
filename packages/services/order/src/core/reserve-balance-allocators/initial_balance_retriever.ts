import { BalanceType } from '@abx-types/balance'
import { CurrencyCode } from '@abx-types/reference-data'
import { Order, OrderDirection } from '@abx-types/order'
import { findRawBalances, getBalanceAdjustmentForBalanceAndOrder } from '@abx-service-clients/balance'

export async function retrieveInitialReserveForOrder({ id: orderId, accountId, symbolId, direction }: Order) {
  const currencyCode = direction === OrderDirection.buy ? (symbolId.slice(-3) as CurrencyCode) : (symbolId.substring(0, 3) as CurrencyCode)

  const rawBalances = await findRawBalances(currencyCode, accountId)
  const balanceForOrderReserveCurrency = rawBalances.find(({ balanceTypeId }) => balanceTypeId === BalanceType.reserved)

  const balanceAdjustmentForTrade = await getBalanceAdjustmentForBalanceAndOrder(balanceForOrderReserveCurrency!.id!, orderId!)

  return Math.abs(balanceAdjustmentForTrade.delta)
}
