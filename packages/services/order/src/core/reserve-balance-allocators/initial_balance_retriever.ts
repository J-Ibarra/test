import { SymbolPair } from '@abx-types/reference-data'
import { Order, OrderDirection } from '@abx-types/order'
import { getOrderBalanceReserveAdjustment } from '@abx-service-clients/balance'
import { getCompleteSymbolDetails } from '@abx-service-clients/reference-data'

const symbolDictionary: Record<string, SymbolPair> = {}

export async function retrieveInitialReserveForOrder({ id: orderId, accountId, symbolId, direction }: Order) {
  const symbolPair = symbolDictionary[symbolId] || (await getCompleteSymbolDetails(symbolId))
  symbolDictionary[symbolId] = symbolPair

  const currencyCode = direction === OrderDirection.buy ? symbolPair.quote.code : symbolPair.base.code

  const reserveBalanceAdjustmentForTrade = await getOrderBalanceReserveAdjustment(currencyCode, accountId, orderId!)

  return Math.abs(reserveBalanceAdjustmentForTrade.delta)
}
