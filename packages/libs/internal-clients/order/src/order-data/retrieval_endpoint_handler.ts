import { getEpicurusInstance } from '@abx/db-connection-utils'
import { OrderDataEndpoints } from './endpoints'
import { Order, OrderMatch, TradeTransaction, OrderDirection } from '@abx-types/order'
import { FindOptions } from 'sequelize'

export function findOrderById(orderId: number): Promise<Order | null> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(OrderDataEndpoints.findOrderById, { orderId })
}

export function findLastOrderMatchForSymbol(symbolId: string): Promise<OrderMatch | null> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(OrderDataEndpoints.findLastOrderMatchForSymbol, { symbolId })
}

export function findLastOrderMatchForSymbols(symbolIds: string[]): Promise<Map<string, OrderMatch | null>> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(OrderDataEndpoints.findLastOrderMatchForSymbol, { symbolIds })
}

export function findOrderMatch(criteria: FindOptions): Promise<OrderMatch> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(OrderDataEndpoints.findOrderMatch, { criteria })
}

export function findOrderMatches(criteria: FindOptions): Promise<OrderMatch[]> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(OrderDataEndpoints.findOrderMatches, { criteria })
}

export function findTradeTransaction(id: number): Promise<TradeTransaction> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(OrderDataEndpoints.findTradeTransaction, { id })
}

export function getOpenOrders(symbolId: string, direction: OrderDirection, limit?: number): Promise<Order[]> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(OrderDataEndpoints.getOpenOrders, { symbolId, direction, limit })
}

export * from './endpoints'
