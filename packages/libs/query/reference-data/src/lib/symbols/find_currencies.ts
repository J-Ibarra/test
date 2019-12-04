import { isEmpty } from 'lodash'

import { getModel } from '@abx/db-connection-utils'
import { Currency, CurrencyCode } from '@abx-types/reference-data'
import { isCryptoCurrency } from './validate_currency'

let currencyInMemoryCache: Currency[] = []

export async function findAllCurrencies(): Promise<Currency[]> {
  if (isEmpty(currencyInMemoryCache)) {
    const currencyInstances = await getModel<Currency>('currency').findAll({
      where: { isEnabled: true },
    })
    const currencies = currencyInstances.map(currencyInstance => currencyInstance.get())

    currencyInMemoryCache = currencies
  }

  return currencyInMemoryCache
}

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

export async function createCurrency(code: CurrencyCode): Promise<Currency> {
  const [currencyInstance] = await getModel<Currency>('currency').findOrCreate({ where: { code } })

  const currency = currencyInstance.get()
  currencyInMemoryCache = currencyInMemoryCache.concat(currency)

  return currency
}

export async function deleteCurrency(code: CurrencyCode): Promise<void> {
  await getModel<Currency>('currency').destroy({ where: { code } })
  currencyInMemoryCache = currencyInMemoryCache.filter(({ code: persistedCurrencyCode }) => persistedCurrencyCode !== code)
}
