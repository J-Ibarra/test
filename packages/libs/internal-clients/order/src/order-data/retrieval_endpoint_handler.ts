import { OrderDataEndpoints } from './endpoints'
import { Order, OrderMatch, TradeTransaction, OrderDirection } from '@abx-types/order'
import { FindOptions } from 'sequelize'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'
import { ReportData } from '@abx-service-clients/report'

export const ORDER_DATA_API_PORT = 3106

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(ORDER_DATA_API_PORT)

export function findOrderById(orderId: number): Promise<Order | null> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<Order | null>(OrderDataEndpoints.findOrderById, { orderId })
}

export function findLastOrderMatchForSymbol(symbolId: string): Promise<OrderMatch | null> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<OrderMatch | null>(OrderDataEndpoints.findLastOrderMatchForSymbol, { symbolId })
}

export async function findLastOrderMatchForSymbols(symbolIds: string[]): Promise<Record<string, OrderMatch | null>> {
  const orderMatches = await internalApiRequestDispatcher.fireRequestToInternalApi<OrderMatch[]>(OrderDataEndpoints.findLastOrderMatchForSymbols, {
    symbolIds,
  })

  return orderMatches.reduce((acc, orderMatch) => ({ ...acc, [orderMatch.symbolId]: orderMatch }), {})
}

export function generateTradeTransactionReportData(tradeTransactionId: number): Promise<ReportData> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<ReportData>(OrderDataEndpoints.generateTradeTransactionReportData, {
    tradeTransactionId,
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
