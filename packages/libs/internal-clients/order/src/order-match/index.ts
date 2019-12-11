import { getEpicurusInstance } from '@abx/db-connection-utils'
import { OrderMatch } from '@abx-types/order'
import { OrderMatchEndpoints } from './endpoints'

export function findOrderMatch(criteria: Partial<OrderMatch>): Promise<OrderMatch> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(OrderMatchEndpoints.findOrderMatch, { criteria })
}

export function findOrderMatches(criteria: Partial<OrderMatch>): Promise<OrderMatch[]> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(OrderMatchEndpoints.findOrderMatch, { criteria })
}

export * from './endpoints'
