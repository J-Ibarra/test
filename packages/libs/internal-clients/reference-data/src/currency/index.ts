import { Currency, CurrencyCode, SymbolPairStateFilter } from '@abx-types/reference-data'
import { CurrencyEndpoints } from './endpoints'
import { isCryptoCurrency } from '../utils'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'
import { REFERENCE_DATA_REST_API_PORT } from '../boundaries'

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(REFERENCE_DATA_REST_API_PORT)
const currencyCodeToCurrency: Record<CurrencyCode, Currency> = {} as any
const currencyIdToCurrency: Record<CurrencyCode, Currency> = {} as any

export async function findAllCurrencyCodes(filter = SymbolPairStateFilter.enabled): Promise<CurrencyCode[]> {
  const currencies = await findAllCurrencies(filter)

  return currencies.map(({ code }) => code)
}

export async function findCryptoCurrencies(filter = SymbolPairStateFilter.enabled): Promise<Currency[]> {
  const allCurrencies = await findAllCurrencies(filter)

  return allCurrencies.filter(({ code }) => isCryptoCurrency(code))
}

export async function findCurrencyForCodes(currencyCodes: CurrencyCode[], state?: SymbolPairStateFilter): Promise<Currency[]> {
  const allCurrencies = await findAllCurrencies(state)

  return currencyCodes.map((currencyCode) => allCurrencies.find(({ code }) => currencyCode === code)!)
}

export async function findCurrencyForCode(currencyCode: CurrencyCode, state?: SymbolPairStateFilter): Promise<Currency> {
  return currencyCodeToCurrency[currencyCode]
    ? currencyCodeToCurrency[currencyCode]
    : internalApiRequestDispatcher.fireRequestToInternalApi<Currency>(CurrencyEndpoints.findCurrencyForCode, { currencyCode, state })
}

export async function findCurrencyForId(currencyId: number, state?: SymbolPairStateFilter): Promise<Currency> {
  if (currencyIdToCurrency[currencyId]) {
    return currencyIdToCurrency[currencyId]
  }

  const allCurrencies = await findAllCurrencies(state)

  return allCurrencies.find(({ id }) => id === currencyId)!
}

export async function getCurrencyId(currencyCode: CurrencyCode, state?: SymbolPairStateFilter): Promise<number> {
  if (currencyCodeToCurrency[currencyCode]) {
    return currencyCodeToCurrency[currencyCode].id
  }

  const allCurrencies = await findAllCurrencies(state)
  const currency = allCurrencies.find(({ code }) => code === currencyCode)!

  return currency.id
}

export async function getCurrencyCode(currencyId: number, state: SymbolPairStateFilter = SymbolPairStateFilter.enabled): Promise<CurrencyCode> {
  if (currencyIdToCurrency[currencyId]) {
    return currencyIdToCurrency[currencyId].code
  }

  return internalApiRequestDispatcher.fireRequestToInternalApi<CurrencyCode>(CurrencyEndpoints.getCurrencyCode, { currencyId, state })
}

export async function findAllCurrencies(state: SymbolPairStateFilter = SymbolPairStateFilter.enabled): Promise<Currency[]> {
  const allCurrencies = await internalApiRequestDispatcher.fireRequestToInternalApi<Currency[]>(CurrencyEndpoints.getAllCurrencies, { state })

  allCurrencies.forEach((currency) => {
    currencyIdToCurrency[currency.id] = currency
    currencyCodeToCurrency[currency.code] = currency
  })

  return allCurrencies
}

export async function getAllCurrenciesEligibleForAccount(accountId: string) {
  return internalApiRequestDispatcher.fireRequestToInternalApi<Currency[]>(CurrencyEndpoints.getAllCurrenciesEligibleForAccount, { accountId })
}

export * from './endpoints'
