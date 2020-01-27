import moment from 'moment'

import { getModel } from '@abx-utils/db-connection-utils'
import { CurrencyCode, CurrencyBoundary } from '@abx-types/reference-data'
import { findAllCurrencyCodes } from './symbols/find_currencies'

let cache = {
  lastInvalidation: new Date(),
  boundaries: [] as CurrencyBoundary[],
}

export async function findAllBoundaries(currencyCodeFilter: CurrencyCode[] = []): Promise<Record<CurrencyCode, CurrencyBoundary>> {
  const allCurrencies = await findAllCurrencyCodes()
  const currencyCodes = currencyCodeFilter.length > 0 ? currencyCodeFilter : allCurrencies

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
