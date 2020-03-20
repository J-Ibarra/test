import { isEmpty } from 'lodash'
import { getModel } from '@abx-utils/db-connection-utils'
import { Currency, CurrencyCode } from '@abx-types/reference-data'

let currencyInMemoryCache: Currency[] = []

export async function fetchAllCurrencies(): Promise<Currency[]> {
  if (isEmpty(currencyInMemoryCache)) {
    currencyInMemoryCache = await findCurrencies()
  }

  return currencyInMemoryCache
}

export async function findCurrencies(): Promise<Currency[]> {
  const currencyInstances = await getModel<Currency>('currency').findAll({
    where: { isEnabled: true }
  })
  return currencyInstances.map(currencyInstance => currencyInstance.get())
}

export async function addCurrencyToCache(currency: Currency): Promise<void> {
  currencyInMemoryCache = currencyInMemoryCache.concat(currency)
}

export async function deleteCurrencyFromCache(code: CurrencyCode): Promise<void> {
  currencyInMemoryCache = currencyInMemoryCache.filter(({ code: persistedCurrencyCode }) => persistedCurrencyCode !== code)
}
