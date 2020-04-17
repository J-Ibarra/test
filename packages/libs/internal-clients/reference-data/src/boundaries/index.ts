import { CurrencyBoundary, CurrencyCode, SymbolBoundaries, SymbolPairStateFilter } from '@abx-types/reference-data'
import { BoundaryEndpoints } from './endpoints'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'

export const REFERENCE_DATA_REST_API_PORT = 3101

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(REFERENCE_DATA_REST_API_PORT)
let currencyBoundaries: Record<CurrencyCode, CurrencyBoundary> = {} as any

export async function findBoundaryForCurrency(currency: CurrencyCode): Promise<CurrencyBoundary> {
  if (currencyBoundaries[currency]) {
    return currencyBoundaries[currency]
  }

  const boundaryForCurrency = await internalApiRequestDispatcher.fireRequestToInternalApi<CurrencyBoundary>(
    BoundaryEndpoints.findBoundaryForCurrency,
    { currency },
  )
  currencyBoundaries[currency] = boundaryForCurrency

  return boundaryForCurrency
}

export async function getAllCurrencyBoundaries(): Promise<Record<CurrencyCode, CurrencyBoundary>> {
  currencyBoundaries = await internalApiRequestDispatcher.fireRequestToInternalApi<Record<CurrencyCode, CurrencyBoundary>>(
    BoundaryEndpoints.getAllCurrencyBoundaries,
    {},
  )

  return currencyBoundaries
}

export async function getSymbolBoundaries(symbolId: string, state = SymbolPairStateFilter.enabled): Promise<SymbolBoundaries> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<SymbolBoundaries>(BoundaryEndpoints.getSymbolBoundaries, { symbolId, state })
}

export async function getBoundariesForCurrencies(currencies: CurrencyCode[]): Promise<Record<CurrencyCode, CurrencyBoundary>> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<Record<CurrencyCode, CurrencyBoundary>>(BoundaryEndpoints.getBoundariesForCurrencies, {
    currencies,
  })
}

export * from './endpoints'
export * from './utils'
