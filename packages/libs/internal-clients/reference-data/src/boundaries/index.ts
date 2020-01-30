import { CurrencyBoundary, CurrencyCode, SymbolBoundaries } from '@abx-types/reference-data'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { BoundaryEndpoints } from './endpoints'

export async function findBoundaryForCurrency(currency: CurrencyCode): Promise<CurrencyBoundary> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BoundaryEndpoints.findBoundaryForCurrency, { currency })
}

export async function getAllCurrencyBoundaries(): Promise<Record<CurrencyCode, CurrencyBoundary>> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(BoundaryEndpoints.getAllCurrencyBoundaries, {})
}

export async function getSymbolBoundaries(symbolId: string): Promise<SymbolBoundaries> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(BoundaryEndpoints.getSymbolBoundaries, { symbolId })
}

export async function getBoundariesForCurrencies(currencies: CurrencyCode[]): Promise<CurrencyBoundary[]> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(BoundaryEndpoints.getBoundariesForCurrencies, { currencies })
}

export * from './endpoints'
export * from './utils'
