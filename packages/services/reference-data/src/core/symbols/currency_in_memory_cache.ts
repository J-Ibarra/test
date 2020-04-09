import { isEmpty } from 'lodash'
import { getModel, MemoryCache } from '@abx-utils/db-connection-utils'
import { Currency, SymbolPairStateFilter, localAndTestEnvironments, Environment, CurrencyCode } from '@abx-types/reference-data'

const memoryCache = MemoryCache.getInstance()
const ENABLED_CURRENCIES_KEY = 'exchange:currencies'
const ALL_CURRENCIES_KEY = 'exchange:currencies'

export async function fetchAllCurrencies(status = SymbolPairStateFilter.enabled): Promise<Currency[]> {
  let filteredCurrencies = memoryCache.get<Currency[]>(status === SymbolPairStateFilter.enabled ? ENABLED_CURRENCIES_KEY : ALL_CURRENCIES_KEY)

  if (isEmpty(filteredCurrencies)) {
    const { allCurrencies, enabledCurrencies } = await refreshInMemoryCache()

    filteredCurrencies = status === SymbolPairStateFilter.enabled ? enabledCurrencies : allCurrencies
  }

  return filteredCurrencies!
}

export async function findCurrencies(): Promise<Currency[]> {
  const currencyInstances = await getModel<Currency>('currency').findAll()
  return currencyInstances.map((currencyInstance) => currencyInstance.get())
}

async function refreshInMemoryCache() {
  const allCurrencies = await findCurrencies()
  const enabledCurrencies = allCurrencies.filter(({ isEnabled }) => isEnabled)

  // We want to always return the most up to date state from the db
  // in order to make testing easier
  if (!localAndTestEnvironments.includes(process.env.NODE_ENV as Environment)) {
    memoryCache.set<Currency[]>({
      key: ALL_CURRENCIES_KEY,
      ttl: 10_000,
      val: allCurrencies,
    })
    memoryCache.set<Currency[]>({
      key: ENABLED_CURRENCIES_KEY,
      ttl: 10_000,
      val: enabledCurrencies,
    })
  }

  return { allCurrencies, enabledCurrencies }
}

export async function updateCurrencyEnabledStatus(code: CurrencyCode, isEnabled: boolean) {
  await getModel<Currency>('currency').update({ isEnabled } as any, {
    where: { code },
  })
}
