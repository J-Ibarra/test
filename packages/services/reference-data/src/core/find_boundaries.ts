import moment from 'moment'

import { getModel } from '@abx-utils/db-connection-utils'
import { CurrencyCode, CurrencyBoundary, SymbolBoundaries } from '@abx-types/reference-data'
import { findAllCurrencyCodes } from './symbols/find_currencies'
import { getCompleteSymbolDetails } from './symbols'

let cache = {
  lastInvalidation: new Date(),
  boundaries: [] as CurrencyBoundary[],
}

export async function findAllBoundaries(currencyCodeFilter: CurrencyCode[] = []): Promise<Record<CurrencyCode, CurrencyBoundary>> {
  const currencyCodes = currencyCodeFilter.length > 0 ? currencyCodeFilter : await findAllCurrencyCodes()

  let boundaries
  if (cache.boundaries.length > 0 && moment().diff(cache.lastInvalidation, 'minute') < 20) {
    boundaries = cache.boundaries
  } else {
    const boundaryInstances = await getModel<CurrencyBoundary>('boundary').findAll()

    cache = {
      lastInvalidation: new Date(),
      boundaries: boundaryInstances.map(boundaryInstance => boundaryInstance.get() as CurrencyBoundary),
    }

    boundaries = cache.boundaries
  }

  return formatBoundaryMap(boundaries.filter(({ currencyCode }) => currencyCodes.includes(currencyCode)))
}

export async function findSymbolBoundaries(symbolId: string): Promise<SymbolBoundaries> {
  const { base, quote, fee } = await getCompleteSymbolDetails(symbolId)
  const { code: baseCode } = base
  const { code: quoteCode } = quote

  const { [baseCode]: baseBoundary, [quoteCode]: quoteBoundary } = await findBoundariesForAll([baseCode, quoteCode])

  return {
    baseBoundary,
    quoteBoundary,
    base,
    quote,
    fee,
  }
}

export async function findBoundaryForCurrency(currencyCode: CurrencyCode): Promise<CurrencyBoundary> {
  const boundaries = await findAllBoundaries([currencyCode])

  return boundaries[currencyCode]
}

export function findBoundariesForAll(currencyCodes: CurrencyCode[]): Promise<Record<CurrencyCode, CurrencyBoundary>> {
  return findAllBoundaries(currencyCodes)
}

function formatBoundaryMap(boundaries: CurrencyBoundary[]) {
  return boundaries.reduce((memo, boundary) => {
    memo[boundary.currencyCode] = boundary
    return memo
  }, {}) as Record<CurrencyCode, CurrencyBoundary>
}
