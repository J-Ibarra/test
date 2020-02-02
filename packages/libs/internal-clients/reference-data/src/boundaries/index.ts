import { CurrencyBoundary, CurrencyCode, SymbolBoundaries } from '@abx-types/reference-data'
import { BoundaryEndpoints } from './endpoints'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'

export const REFERENCE_DATA_REST_API_PORT = 3101

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(REFERENCE_DATA_REST_API_PORT)

export async function findBoundaryForCurrency(currency: CurrencyCode): Promise<CurrencyBoundary> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<CurrencyBoundary>(BoundaryEndpoints.findBoundaryForCurrency, { currency })
}

export async function getAllCurrencyBoundaries(): Promise<Record<CurrencyCode, CurrencyBoundary>> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<Record<CurrencyCode, CurrencyBoundary>>(BoundaryEndpoints.getAllCurrencyBoundaries, {})
}

export async function getSymbolBoundaries(symbolId: string): Promise<SymbolBoundaries> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<SymbolBoundaries>(BoundaryEndpoints.getSymbolBoundaries, { symbolId })
}

export async function getBoundariesForCurrencies(currencies: CurrencyCode[]): Promise<CurrencyBoundary[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<CurrencyBoundary[]>(BoundaryEndpoints.getBoundariesForCurrencies, { currencies })
}

export * from './endpoints'
export * from './utils'
