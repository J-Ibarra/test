import { OrderDataEndpoints } from './endpoints'
import { Order, OrderMatch, TradeTransaction, OrderDirection } from '@abx-types/order'
import { FindOptions } from 'sequelize'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'

export const ORDER_DATA_API_PORT = 3106

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(ORDER_DATA_API_PORT)

export function findOrderById(orderId: number): Promise<Order | null> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<Order | null>(OrderDataEndpoints.findOrderById, { orderId })
}

export function findLastOrderMatchForSymbol(symbolId: string): Promise<OrderMatch | null> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<OrderMatch | null>(OrderDataEndpoints.findLastOrderMatchForSymbol, { symbolId })
}

export function findLastOrderMatchForSymbols(symbolIds: string[]): Promise<Map<string, OrderMatch | null>> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<Map<string, OrderMatch | null>>(OrderDataEndpoints.findLastOrderMatchForSymbol, {
    symbolIds,
  })
}

export function findOrderMatch(criteria: FindOptions): Promise<OrderMatch> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<OrderMatch>(OrderDataEndpoints.findOrderMatch, { ...criteria })
}

export function findOrderMatches(criteria: FindOptions): Promise<OrderMatch[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<OrderMatch[]>(OrderDataEndpoints.findOrderMatches, { ...criteria })
}

export function findTradeTransaction(id: number): Promise<TradeTransaction> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<TradeTransaction>(OrderDataEndpoints.findTradeTransaction, { id })
}

export function getOpenOrders(symbolId: string, orderDirection: OrderDirection, limit?: number): Promise<Order[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<Order[]>(OrderDataEndpoints.getOpenOrders, { symbolId, orderDirection, limit })
}

export * from './endpoints'
