import { getModel } from '@abx-utils/db-connection-utils'
import { Currency, CurrencyCode } from '@abx-types/reference-data'
import { isCryptoCurrency } from '@abx-service-clients/reference-data'
import { getFeatureFlags } from '../config'
import { isBoolean } from 'util'
import { fetchAllCurrencies, addCurrencyToCache, deleteCurrencyFromCache } from './currency_in_memory_cache'

export async function findCurrenciesByAccountId(accountId: string): Promise<Currency[]> {
  const allCurrencies = await fetchAllCurrencies()
  const featureFlags = await getFeatureFlags()

  return allCurrencies.filter((currency) => {
    // if the currency code exists in the feature flag
    const featureFlagForCurrency = featureFlags
      .find(flag => flag.name.toString() === currency.code.toString())
    if (!!featureFlagForCurrency) {
      // either the enabled value is boolean or
      // we check if enabled array contains the current accountId
      return isBoolean(featureFlagForCurrency.enabled) ? 
        featureFlagForCurrency.enabled :
        featureFlagForCurrency.enabled
          .some(enabledAccount => enabledAccount === accountId)
    }

    return true
  })
}

export async function findAllCurrencyCodes(): Promise<CurrencyCode[]> {
  const currencies = await fetchAllCurrencies()

  return currencies.map(({ code }) => code)
}

export async function findCryptoCurrencies() {
  const allCurrencies = await fetchAllCurrencies()

  return allCurrencies.filter(({ code }) => isCryptoCurrency(code)).map(currency => currency.code)
}

export async function findCurrencyForCodes(currencyCodes: CurrencyCode[]): Promise<Currency[]> {
  const allCurrencies = await fetchAllCurrencies()

  return currencyCodes.map(currencyCode => allCurrencies.find(({ code }) => currencyCode === code)!)
}

export async function findCurrencyForCode(currencyCode: CurrencyCode): Promise<Currency> {
  const allCurrencies = await fetchAllCurrencies()

  return allCurrencies.find(({ code }) => code === currencyCode)!
}

export async function findCurrencyForId(currencyId: number): Promise<Currency> {
  const allCurrencies = await fetchAllCurrencies()

  return allCurrencies.find(({ id }) => id === currencyId)!
}

export async function getCurrencyId(currencyCode: CurrencyCode): Promise<number> {
  const allCurrencies = await fetchAllCurrencies()
  const currency = allCurrencies.find(({ code }) => code === currencyCode)!

  return currency.id
}

export async function getCurrencyCode(currencyId: number) {
  const allCurrencies = await fetchAllCurrencies()
  const currency = allCurrencies.find(({ id }) => id === currencyId)

  return currency && currency.code
}

export async function createCurrency(code: CurrencyCode): Promise<Currency> {
  const [currencyInstance] = await getModel<Currency>('currency').findOrCreate({ where: { code } })

  const currency = currencyInstance.get()
  addCurrencyToCache(currency)

  return currency
}

export async function deleteCurrency(code: CurrencyCode): Promise<void> {
  await getModel<Currency>('currency').destroy({ where: { code } })
  deleteCurrencyFromCache(code)
}
