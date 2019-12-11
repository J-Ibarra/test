import { Currency, CurrencyCode } from '@abx-types/reference-data'
import { getEpicurusInstance } from '@abx/db-connection-utils'
import { CurrencyEndpoints } from './endpoints'
import { isCryptoCurrency } from '../utils'
import moment from 'moment'

let lastCacheUpdateTime: Date = new Date()
let currencyInMemoryCache: Currency[] = []

export async function findAllCurrencyCodes(): Promise<CurrencyCode[]> {
  const currencies = await findAllCurrencies()

  return currencies.map(({ code }) => code)
}

export async function findCryptoCurrencies() {
  const allCurrencies = await findAllCurrencies()

  return allCurrencies.filter(({ code }) => isCryptoCurrency(code)).map(currency => currency.code)
}

export async function findCurrencyForCodes(currencyCodes: CurrencyCode[]): Promise<Currency[]> {
  const allCurrencies = await findAllCurrencies()

  return currencyCodes.map(currencyCode => allCurrencies.find(({ code }) => currencyCode === code)!)
}

export async function findCurrencyForCode(currencyCode: CurrencyCode): Promise<Currency> {
  const allCurrencies = await findAllCurrencies()

  return allCurrencies.find(({ code }) => code === currencyCode)!
}

export async function findCurrencyForId(currencyId: number): Promise<Currency> {
  const allCurrencies = await findAllCurrencies()

  return allCurrencies.find(({ id }) => id === currencyId)!
}

export async function getCurrencyId(currencyCode: CurrencyCode): Promise<number> {
  const allCurrencies = await findAllCurrencies()
  const currency = allCurrencies.find(({ code }) => code === currencyCode)!

  return currency.id
}

export async function getCurrencyCode(currencyId: number) {
  const allCurrencies = await findAllCurrencies()
  const currency = allCurrencies.find(({ id }) => id === currencyId)

  return currency && currency.code
}

export async function deleteCurrency(code: CurrencyCode): Promise<void> {
  currencyInMemoryCache = currencyInMemoryCache.filter(({ code: persistedCurrencyCode }) => persistedCurrencyCode !== code)
}

async function findAllCurrencies(): Promise<Currency[]> {
  if (currencyInMemoryCache.length === 0 && moment().diff(lastCacheUpdateTime, 'minute') < 5) {
    const epicurus = getEpicurusInstance()
    currencyInMemoryCache = await epicurus.request(CurrencyEndpoints.getAllCurrencies, {})
    lastCacheUpdateTime = new Date()
  }

  return currencyInMemoryCache
}

export * from './endpoints'
