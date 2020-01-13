import { CurrencyBoundary, CurrencyCode } from '@abx-types/reference-data'
import { getEpicurusInstance } from '@abx/db-connection-utils'
import { BoundaryEndpoints } from './endpoints'

export async function findBoundaryForCurrency(currency: CurrencyCode): Promise<CurrencyBoundary> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BoundaryEndpoints.findBoundaryForCurrency, { currency })
}

export async function getAllCurrencyBoundaries(): Promise<Record<CurrencyCode, CurrencyBoundary>> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(BoundaryEndpoints.getAllCurrencyBoundaries, {})
}

export * from './endpoints'
export * from './utils'
