import { CurrencyBoundary, CurrencyCode, SymbolBoundaries } from '@abx-types/reference-data'
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

export async function getSymbolBoundaries(symbolId: string): Promise<SymbolBoundaries> {
  const epicurus = getEpicurusInstance()
  const [base, quote] = symbolId.split('_')

  return epicurus.request(BoundaryEndpoints.getBoundariesForCurrencies, { base, quote })
}

export * from './endpoints'
