import { isEmpty } from 'lodash'
import { getModel, MemoryCache } from '@abx-utils/db-connection-utils'
import { Currency, CurrencyCode } from '@abx-types/reference-data'

const memoryCache = MemoryCache.getInstance()
const CURRENCIES_KEY = 'exchange:currencies'

export async function fetchAllCurrencies(): Promise<Currency[]> {
  let cachedCurrencies = memoryCache.get<Currency[]>(CURRENCIES_KEY)
  if (isEmpty(cachedCurrencies)) {
    cachedCurrencies = await findCurrencies()
    memoryCache.set<Currency[]>({
      key: CURRENCIES_KEY,
      ttl: 10_000,
      val: cachedCurrencies
    })
  }

  return cachedCurrencies!
}

export async function findCurrencies(): Promise<Currency[]> {
  const currencyInstances = await getModel<Currency>('currency').findAll({
    where: { isEnabled: true }
  })
  return currencyInstances.map(currencyInstance => currencyInstance.get())
}

export async function addCurrencyToCache(currency: Currency): Promise<void> {
  const currencies = memoryCache.get<Currency[]>(CURRENCIES_KEY) || []
  memoryCache.set<Currency[]>({
    key: CURRENCIES_KEY,
    ttl: 10_000,
    val: currencies.concat([currency])
  })
}

export async function deleteCurrencyFromCache(code: CurrencyCode): Promise<void> {
  const currencies = memoryCache.get<Currency[]>(CURRENCIES_KEY) || []
  memoryCache.set<Currency[]>({
    key: CURRENCIES_KEY,
    ttl: 10_000,
    val: currencies.filter(({ code: persistedCurrencyCode }) => persistedCurrencyCode !== code)
  })
}
