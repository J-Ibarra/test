import { CurrencyBoundary, CurrencyCode } from '@abx-types/reference-data'
import { getEpicurusInstance } from '@abx/db-connection-utils'
import { BoundaryEndpoints } from './endpoints'
import moment from 'moment'

let lastCacheUpdateTime: Date = new Date()
let boundariesInMemoryCache: Record<CurrencyCode, CurrencyBoundary> = {} as any

export async function findBoundaryForCurrency(currency: CurrencyCode): Promise<CurrencyBoundary> {
  if (!!boundariesInMemoryCache[currency]) {
    return boundariesInMemoryCache[currency]
  }

  await getAllCurrencyBoundaries()

  return boundariesInMemoryCache[currency]
}

export async function getAllCurrencyBoundaries(): Promise<Record<CurrencyCode, CurrencyBoundary>> {
  if (Object.keys(boundariesInMemoryCache).length > 0 || moment().diff(lastCacheUpdateTime, 'minute') < 5) {
    return boundariesInMemoryCache
  }

  const epicurus = getEpicurusInstance()
  boundariesInMemoryCache = (await epicurus.request(BoundaryEndpoints.getAllCurrencyBoundaries, {})) as Record<CurrencyCode, CurrencyBoundary>

  return boundariesInMemoryCache
}

export * from './endpoints'
