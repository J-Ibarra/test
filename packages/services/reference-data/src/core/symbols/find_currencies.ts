import { Currency, CurrencyCode, FeatureFlag, SymbolPairStateFilter } from '@abx-types/reference-data'
import { isCryptoCurrency } from '@abx-service-clients/reference-data'
import { getFeatureFlags } from '../config'
import { isBoolean } from 'util'
import { fetchAllCurrencies } from './currency_in_memory_cache'

export async function findCurrenciesByAccountId(accountId: string): Promise<Currency[]> {
  const allCurrencies = await fetchAllCurrencies(SymbolPairStateFilter.all)
  const featureFlags = await getFeatureFlags()

  return allCurrencies.filter((currency) => isAccountEligibleForCurrency(accountId, currency, featureFlags))
}

function isAccountEligibleForCurrency(accountId: string, currency: Currency, featureFlags: FeatureFlag[]): boolean {
  // if the currency code exists in the feature flag
  const featureFlagForCurrency = featureFlags.find((flag) => flag.name.toString() === currency.code.toString())

  if (!!featureFlagForCurrency) {
    // either the enabled value is boolean or
    // we check if enabled array contains the current accountId
    return isBoolean(featureFlagForCurrency.enabled)
      ? featureFlagForCurrency.enabled
      : featureFlagForCurrency.enabled.some((enabledAccount) => enabledAccount === accountId)
  }

  return currency.isEnabled!
}

export async function findAllCurrencyCodes(state = SymbolPairStateFilter.enabled): Promise<CurrencyCode[]> {
  const currencies = await fetchAllCurrencies(state)

  return currencies.map(({ code }) => code)
}

export async function findCryptoCurrencies() {
  const allCurrencies = await fetchAllCurrencies()

  return allCurrencies.filter(({ code }) => isCryptoCurrency(code)).map((currency) => currency.code)
}

export async function findCurrencyForCodes(currencyCodes: CurrencyCode[]): Promise<Currency[]> {
  const allCurrencies = await fetchAllCurrencies()

  return currencyCodes.map((currencyCode) => allCurrencies.find(({ code }) => currencyCode === code)!)
}

export async function findCurrencyForCode(currencyCode: CurrencyCode, state = SymbolPairStateFilter.enabled): Promise<Currency> {
  const allCurrencies = await fetchAllCurrencies(state)

  return allCurrencies.find(({ code }) => code === currencyCode)!
}

export async function findCurrencyForId(currencyId: number): Promise<Currency> {
  const allCurrencies = await fetchAllCurrencies()

  return allCurrencies.find(({ id }) => id === currencyId)!
}

export async function getCurrencyId(currencyCode: CurrencyCode, state = SymbolPairStateFilter.enabled): Promise<number> {
  const allCurrencies = await fetchAllCurrencies(state)
  const currency = allCurrencies.find(({ code }) => code === currencyCode)!

  return currency.id
}

export async function getCurrencyCode(currencyId: number, state = SymbolPairStateFilter.enabled) {
  const allCurrencies = await fetchAllCurrencies(state)
  const currency = allCurrencies.find(({ id }) => id === currencyId)

  return currency && currency.code
}
